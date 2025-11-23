import { supabase } from "@/integrations/supabase/client";

// IndexedDB configuration for offline storage
const DB_NAME = "afripos_offline";
const DB_VERSION = 1;

interface SyncQueueItem {
  id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  data: any;
  synced: boolean;
  created_at: Date;
}

class OfflineSync {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores for offline data
        if (!db.objectStoreNames.contains("products")) {
          db.createObjectStore("products", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("categories")) {
          db.createObjectStore("categories", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("sync_queue")) {
          const syncStore = db.createObjectStore("sync_queue", {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("synced", "synced", { unique: false });
        }
      };
    });
  }

  // Cache products for offline use
  async cacheProducts(products: any[]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction("products", "readwrite");
    const store = tx.objectStore("products");

    for (const product of products) {
      store.put(product);
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
    });
  }

  // Cache categories for offline use
  async cacheCategories(categories: any[]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction("categories", "readwrite");
    const store = tx.objectStore("categories");

    for (const category of categories) {
      store.put(category);
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
    });
  }

  // Get cached products
  async getCachedProducts(): Promise<any[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("products", "readonly");
      const store = tx.objectStore("products");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached categories
  async getCachedCategories(): Promise<any[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("categories", "readonly");
      const store = tx.objectStore("categories");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Add to sync queue
  async addToSyncQueue(item: Omit<SyncQueueItem, "id" | "created_at" | "synced">) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction("sync_queue", "readwrite");
    const store = tx.objectStore("sync_queue");

    const queueItem: Omit<SyncQueueItem, "id"> = {
      ...item,
      synced: false,
      created_at: new Date(),
    };

    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get unsynced items
  async getUnsyncedItems(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("sync_queue", "readonly");
      const store = tx.objectStore("sync_queue");
      const index = store.index("synced");
      const request = index.openCursor(IDBKeyRange.only(false));
      const results: SyncQueueItem[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync pending items to server
  async syncToServer() {
    const unsyncedItems = await this.getUnsyncedItems();

    if (unsyncedItems.length === 0) return { success: true, synced: 0 };

    let syncedCount = 0;

    for (const item of unsyncedItems) {
      try {
        // Insert into Supabase sync_queue
        const { error } = await supabase.from("sync_queue").insert({
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          action: item.action,
          data: item.data,
          synced: false,
        });

        if (!error) {
          // Mark as synced in local DB
          await this.markAsSynced(item.id!);
          syncedCount++;
        }
      } catch (error) {
        console.error("Sync error:", error);
      }
    }

    return { success: true, synced: syncedCount };
  }

  // Mark item as synced
  private async markAsSynced(id: string | number) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction("sync_queue", "readwrite");
    const store = tx.objectStore("sync_queue");

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.synced = true;
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve(updateRequest.result);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Check if online
  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const offlineSync = new OfflineSync();
