import { makeAutoObservable } from 'mobx';

/**
 * A generic collection class that maintains both Map and List representations
 * for efficient lookups and consistent ordering
 */
class Collection<T extends { id: string }> {
    private itemsMap = new Map<string, T>();
    private itemsList: T[] = [];
    private idField: keyof T;

    /**
     * @param idField The field to use as unique identifier (defaults to 'id')
     */
    constructor(idField: keyof T = 'id' as keyof T) {
        this.idField = idField;
        makeAutoObservable(this);
    }

    /**
     * Add or update an item in the collection
     */
    set(item: T): T {
        const id = item[this.idField] as unknown as string;
        const existingIndex = this.itemsList.findIndex(i => (i[this.idField] as unknown as string) === id);
        
        if (existingIndex >= 0) {
            // Update existing item
            this.itemsMap.set(id, item);
            this.itemsList[existingIndex] = item;
        } else {
            // Add new item
            this.itemsMap.set(id, item);
            this.itemsList.push(item);
        }
        
        return item;
    }

    /**
     * Add or update multiple items in the collection
     */
    setMany(items: T[]): void {
        items.forEach(item => this.set(item));
    }

    /**
     * Get an item by ID
     */
    get(id: string): T | undefined {
        return this.itemsMap.get(id);
    }

    /**
     * Check if an item exists in the collection
     */
    has(id: string): boolean {
        return this.itemsMap.has(id);
    }

    /**
     * Remove an item from the collection
     */
    remove(id: string): boolean {
        if (!this.itemsMap.has(id)) return false;
        
        this.itemsMap.delete(id);
        const index = this.itemsList.findIndex(i => (i[this.idField] as unknown as string) === id);
        if (index >= 0) {
            this.itemsList.splice(index, 1);
        }
        
        return true;
    }

    /**
     * Get all items as an array (maintains insertion order)
     */
    get items(): T[] {
        return [...this.itemsList];
    }

    /**
     * Get the number of items in the collection
     */
    get size(): number {
        return this.itemsList.length;
    }

    /**
     * Clear all items from the collection
     */
    clear(): void {
        this.itemsMap.clear();
        this.itemsList = [];
    }

    /**
     * Find items that match the predicate
     */
    find(predicate: (item: T) => boolean): T | undefined {
        return this.itemsList.find(predicate);
    }

    /**
     * Filter items that match the predicate
     */
    filter(predicate: (item: T) => boolean): T[] {
        return this.itemsList.filter(predicate);
    }

    /**
     * Map over the items in the collection
     */
    map<U>(callback: (item: T, index: number) => U): U[] {
        return this.itemsList.map(callback);
    }

    /**
     * Sort the collection using the provided compare function
     */
    sort(compareFn?: (a: T, b: T) => number): T[] {
        if (compareFn) {
            this.itemsList.sort(compareFn);
        }
        return this.items;
    }

    /**
     * Get the first item in the collection
     */
    first(): T | undefined {
        return this.itemsList[0];
    }

    /**
     * Get the last item in the collection
     */
    last(): T | undefined {
        return this.itemsList[this.itemsList.length - 1];
    }
}

export default Collection;