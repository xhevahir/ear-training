import { intervalExercise } from './interval';
import { ExerciseRegistry } from './registry';
import { scaleDegreeExercise } from './scale-degree';

export function createRegistry(): ExerciseRegistry {
  return new ExerciseRegistry([intervalExercise, scaleDegreeExercise]);
}
