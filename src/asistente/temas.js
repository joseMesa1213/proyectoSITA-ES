// Diccionario de temas → materias (por código de la UdeA, el mismo de la semilla).
// Sirve para entender preguntas por tema ("derivadas", "sql", "python") o abreviaturas ("mate"),
// aunque ninguna tutoría mencione esa palabra.
//
// Reglas para mantenerlo:
// - Palabras sin tildes y en minúscula (el clasificador normaliza lo que escribe el usuario).
// - No repetir palabras que ya están en el nombre de una materia ("cálculo", "física"): esas
//   se encuentran solas comparando con los nombres.
// - Si un código no existe en la base de datos, simplemente se ignora.

const MATEMATICAS = [
  "2555101", "2555131", "2555121", "2555231", "2555221", "2508207", "2508303", "2508407", "2508308", "2508408",
];

export const TEMAS = [
  // Grupo: "mate" puede ser cualquiera de las materias de matemáticas
  { codigos: MATEMATICAS, palabras: ["mate", "mates", "matematica", "matematicas"] },

  // Álgebra y Trigonometría
  { codigos: ["2555101"], palabras: ["trigonometria", "seno", "coseno", "tangente", "logaritmo", "logaritmos", "polinomio", "polinomios", "factorizacion", "factorizar"] },
  // Cálculo Diferencial
  { codigos: ["2555131"], palabras: ["derivada", "derivadas", "derivar", "derivacion", "limite", "limites", "continuidad"] },
  // Geometría Vectorial y Analítica
  { codigos: ["2555121"], palabras: ["vector", "vectores", "recta", "rectas", "plano", "planos", "conica", "conicas", "parabola", "elipse"] },
  // Cálculo Integral
  { codigos: ["2555231"], palabras: ["integral", "integrales", "integracion", "integrar", "antiderivada", "antiderivadas"] },
  // Álgebra Lineal
  { codigos: ["2555221"], palabras: ["matriz", "matrices", "determinante", "determinantes", "gauss", "autovalores", "eigenvalores"] },
  // Matemáticas Discretas I y II
  { codigos: ["2508207", "2508303"], palabras: ["conjunto", "conjuntos", "proposicional", "induccion", "combinatoria", "recurrencia", "grafo", "grafos"] },
  // Ecuaciones Diferenciales y Métodos Numéricos
  { codigos: ["2508407"], palabras: ["edo", "edos", "laplace", "euler"] },
  // Teoría de la Probabilidad y Colas
  { codigos: ["2508308"], palabras: ["bayes", "poisson", "binomial", "distribucion", "distribuciones"] },
  // Métodos Estadísticos
  { codigos: ["2508408"], palabras: ["estadistica", "regresion", "hipotesis", "varianza", "muestreo"] },
  // Física Mecánica
  { codigos: ["2536201"], palabras: ["newton", "cinematica", "dinamica", "fuerza", "fuerzas", "movimiento", "energia", "torque"] },
  // Lógica y Representación I
  { codigos: ["2508208"], palabras: ["algoritmo", "algoritmos", "algoritmia", "pseudocodigo", "flujograma"] },
  // Técnicas de Programación y Laboratorio
  { codigos: ["2508307"], palabras: ["programar", "python", "java", "javascript", "recursion", "recursividad", "poo"] },
  // Estructura de Datos y Laboratorio
  { codigos: ["2508507"], palabras: ["pila", "pilas", "arbol", "arboles", "hash", "enlazada", "enlazadas"] },
  // Bases de Datos y Laboratorio
  { codigos: ["2508609"], palabras: ["sql", "join", "normalizacion", "relacional", "postgres", "postgresql", "mysql"] },
];
