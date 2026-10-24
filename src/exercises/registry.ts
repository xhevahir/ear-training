import type { ExerciseItemCatalog } from '../core/curriculum';
import type { ExerciseType } from './types';

export class ExerciseRegistry {
  private readonly types = new Map<string, ExerciseType>();

  constructor(types: ExerciseType[] = []) {
    for (const t of types) this.register(t);
  }

  register(type: ExerciseType): void {
    if (this.types.has(type.name)) throw new Error(`exercise "${type.name}" already registered`);
    this.types.set(type.name, type);
  }

  get(name: string): ExerciseType {
    const type = this.types.get(name);
    if (!type) throw new Error(`unknown exercise type "${name}"`);
    return type;
  }

  /** Item catalog used to validate a curriculum against the registered exercise types. */
  catalog(): ExerciseItemCatalog {
    return Object.fromEntries([...this.types].map(([name, t]) => [name, t.items]));
  }
}
