import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, productName, imageUrl } = await req.json();
    console.log('Analyzing product:', { productId, productName, imageUrl });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Call Lovable AI with image and product name
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a product analysis expert. Analyze the product image and name to generate:
1. A specific product category
2. A detailed, compelling product description (2-3 sentences)
3. An array of 3-5 relevant product variants (like sizes, colors, materials, etc.)

Return your response as a JSON object with this exact structure:
{
  "category": "string",
  "description": "string",
  "variants": ["variant1", "variant2", "variant3"]
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Product Name: ${productName}\n\nPlease analyze this product and provide category, description, and variants.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log('AI response:', aiData);
    
    const content = aiData.choices[0].message.content;
    
    // Extract JSON from the response
    let analysisData;
    try {
      // Try to parse the entire content as JSON
      analysisData = JSON.parse(content);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Update product in database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabaseClient
      .from('products')
      .update({
        category: analysisData.category,
        description: analysisData.description,
        variants: analysisData.variants,
        analyzed: true
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Product analysis complete:', analysisData);

    return new Response(
      JSON.stringify({ 
        success: true,
        ...analysisData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-product function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});