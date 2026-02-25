/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

/**
 * Spanish Prompt Templates / Plantillas de Prompts en Español
 */

import { PromptTemplate } from './templates';

export const SPANISH_TEMPLATES: PromptTemplate[] = [
  // Plantillas de Escritura
  {
    id: 'es-writing-improve',
    title: 'Mejorar Mi Escritura',
    content: `Por favor, mejora el siguiente texto manteniendo su significado y tono original. Enfócate en:
- Claridad y concisión
- Gramática y puntuación
- Fluidez y legibilidad
- Elección de palabras

Texto a mejorar:
{{texto}}

Por favor, proporciona la versión mejorada y explica brevemente los cambios principales que realizaste.`,
    tags: ['escritura', 'edición'],
    category: 'writing',
    description: 'Mejora y pule cualquier texto escrito',
    language: 'es',
  },
  {
    id: 'es-writing-email',
    title: 'Redactor de Correos Profesionales',
    content: `Escribe un correo profesional con los siguientes detalles:

Propósito: {{propósito}}
Destinatario: {{destinatario}}
Tono: {{tono: formal/amigable/urgente}}
Puntos clave a incluir:
{{puntos_clave}}

Por favor, escribe un correo claro y profesional que comunique efectivamente estos puntos.`,
    tags: ['escritura', 'email', 'negocios'],
    category: 'writing',
    description: 'Redacta correos profesionales para cualquier situación',
    language: 'es',
  },
  {
    id: 'es-writing-summarize',
    title: 'Resumir Texto',
    content: `Por favor, resume el siguiente texto en {{longitud: unas pocas oraciones/un párrafo/puntos clave}}:

{{texto}}

Enfócate en las ideas principales y conclusiones clave. Mantén la precisión siendo conciso.`,
    tags: ['escritura', 'resumen'],
    category: 'writing',
    description: 'Crea resúmenes concisos de contenido extenso',
    language: 'es',
  },
  {
    id: 'es-writing-blog',
    title: 'Esquema de Publicación de Blog',
    content: `Crea un esquema detallado para una publicación de blog sobre el siguiente tema:

Tema: {{tema}}
Audiencia objetivo: {{audiencia}}
Longitud deseada: {{longitud: corta/media/larga}}
Tono: {{tono: profesional/casual/educativo}}

Por favor incluye:
1. Un título y subtítulo atractivos
2. Gancho de introducción
3. Secciones principales con subpuntos
4. Conclusiones clave
5. Llamada a la acción`,
    tags: ['escritura', 'blog', 'contenido'],
    category: 'writing',
    description: 'Estructura publicaciones de blog desde cero',
    language: 'es',
  },

  // Plantillas de Programación
  {
    id: 'es-coding-explain',
    title: 'Explicar Código',
    content: `Por favor, explica el siguiente código en detalle:

\`\`\`{{lenguaje}}
{{código}}
\`\`\`

Proporciona:
1. Una descripción general de lo que hace el código
2. Explicación línea por línea de las partes clave
3. Posibles problemas o mejoras
4. Casos de uso de ejemplo`,
    tags: ['programación', 'aprendizaje'],
    category: 'coding',
    description: 'Obtén explicaciones detalladas de cualquier código',
    language: 'es',
  },
  {
    id: 'es-coding-debug',
    title: 'Depurar Mi Código',
    content: `Estoy encontrando un problema con mi código. Por favor, ayúdame a depurarlo.

Lenguaje: {{lenguaje}}
Código:
\`\`\`
{{código}}
\`\`\`

Error/Problema: {{descripción_error}}

Comportamiento esperado: {{esperado}}
Comportamiento actual: {{actual}}

Por favor, identifica el problema y proporciona una versión corregida con explicaciones.`,
    tags: ['programación', 'depuración'],
    category: 'coding',
    description: 'Encuentra y corrige errores en tu código',
    language: 'es',
  },
  {
    id: 'es-coding-convert',
    title: 'Convertir Código',
    content: `Por favor, convierte el siguiente código de {{lenguaje_origen}} a {{lenguaje_destino}}:

\`\`\`{{lenguaje_origen}}
{{código}}
\`\`\`

Requisitos:
- Mantener la misma funcionalidad
- Usar patrones idiomáticos del lenguaje destino
- Incluir comentarios explicando cambios significativos
- Notar características que no se traducen directamente`,
    tags: ['programación', 'conversión'],
    category: 'coding',
    description: 'Convierte código entre lenguajes de programación',
    language: 'es',
  },
  {
    id: 'es-coding-review',
    title: 'Revisión de Código',
    content: `Por favor, revisa el siguiente código y proporciona retroalimentación:

\`\`\`{{lenguaje}}
{{código}}
\`\`\`

Por favor evalúa:
1. Calidad y legibilidad del código
2. Posibles bugs o casos extremos
3. Consideraciones de rendimiento
4. Preocupaciones de seguridad
5. Mejores prácticas y sugerencias de mejora

Proporciona retroalimentación específica y accionable con ejemplos.`,
    tags: ['programación', 'revisión'],
    category: 'coding',
    description: 'Obtén revisiones de código detalladas con sugerencias',
    language: 'es',
  },
  {
    id: 'es-coding-regex',
    title: 'Crear Patrón Regex',
    content: `Crea un patrón de expresión regular para el siguiente requisito:

{{requisito}}

Por favor proporciona:
1. El patrón regex
2. Explicación de cada componente
3. Ejemplos de coincidencias y no coincidencias
4. Casos extremos a considerar
5. Fragmento de código mostrando uso en {{lenguaje: JavaScript/Python/etc}}`,
    tags: ['programación', 'regex'],
    category: 'coding',
    description: 'Genera y explica patrones regex',
    language: 'es',
  },

  // Plantillas de Análisis
  {
    id: 'es-analysis-pros-cons',
    title: 'Análisis de Pros y Contras',
    content: `Por favor, proporciona un análisis completo de pros y contras de:

{{tema}}

Contexto: {{contexto}}

Para cada punto, explica:
- La importancia
- El impacto potencial
- Consideraciones relevantes

Concluye con un resumen equilibrado y una recomendación si aplica.`,
    tags: ['análisis', 'toma-de-decisiones'],
    category: 'analysis',
    description: 'Evalúa opciones para mejores decisiones',
    language: 'es',
  },
  {
    id: 'es-analysis-compare',
    title: 'Comparar Opciones',
    content: `Por favor, compara las siguientes opciones:

Opción A: {{opción_a}}
Opción B: {{opción_b}}
{{opción_c: Opción C (opcional)}}

Criterios a considerar: {{criterios}}

Proporciona:
1. Comparación característica por característica
2. Fortalezas y debilidades de cada una
3. Recomendaciones según caso de uso
4. Recomendación general basada en {{prioridad}}`,
    tags: ['análisis', 'comparación'],
    category: 'analysis',
    description: 'Compara múltiples opciones sistemáticamente',
    language: 'es',
  },
  {
    id: 'es-analysis-research',
    title: 'Resumen de Investigación',
    content: `Por favor, proporciona un resumen de investigación sobre:

Tema: {{tema}}
Áreas de enfoque: {{áreas_enfoque}}
Profundidad: {{profundidad: general/detallada/exhaustiva}}

Incluye:
1. Conceptos clave y definiciones
2. Estado actual del campo
3. Hallazgos principales o tendencias
4. Desafíos y preguntas abiertas
5. Recursos recomendados para lectura adicional`,
    tags: ['análisis', 'investigación'],
    category: 'analysis',
    description: 'Obtén resúmenes de investigación estructurados',
    language: 'es',
  },

  // Plantillas Creativas
  {
    id: 'es-creative-story',
    title: 'Inicio de Historia',
    content: `Escribe una historia corta con los siguientes elementos:

Género: {{género}}
Escenario: {{escenario}}
Personaje principal: {{personaje}}
Conflicto central: {{conflicto}}
Tono: {{tono}}
Longitud: {{longitud: microrrelato/cuento corto}}

Crea una narrativa atractiva con descripciones vívidas, diálogos convincentes y un arco satisfactorio.`,
    tags: ['creativo', 'escritura', 'ficción'],
    category: 'creative',
    description: 'Genera ideas creativas y borradores de historias',
    language: 'es',
  },
  {
    id: 'es-creative-brainstorm',
    title: 'Lluvia de Ideas',
    content: `Genera ideas creativas para:

Tema/Desafío: {{tema}}
Contexto: {{contexto}}
Restricciones: {{restricciones}}
Número de ideas: {{cantidad: 5-10}}

Para cada idea, proporciona:
- Breve descripción
- Beneficios clave
- Desafíos potenciales
- Primeros pasos para implementar

Piensa fuera de lo común e incluye enfoques tanto convencionales como no convencionales.`,
    tags: ['creativo', 'lluvia-de-ideas', 'ideas'],
    category: 'creative',
    description: 'Genera ideas creativas para cualquier desafío',
    language: 'es',
  },
  {
    id: 'es-creative-naming',
    title: 'Generador de Nombres',
    content: `Genera ideas de nombres para:

Tipo: {{tipo: producto/empresa/proyecto/personaje}}
Descripción: {{descripción}}
Tono/Estilo: {{tono: profesional/divertido/moderno/clásico}}
Palabras clave a incorporar: {{palabras_clave}}

Por favor proporciona:
1. 10 sugerencias de nombres con breves explicaciones
2. Consideraciones de disponibilidad de dominio (para nombres de negocios)
3. Posibles problemas o consideraciones para cada uno
4. Top 3 recomendaciones con razonamiento`,
    tags: ['creativo', 'nombres', 'branding'],
    category: 'creative',
    description: 'Genera nombres para productos, proyectos o marcas',
    language: 'es',
  },

  // Plantillas de Negocios
  {
    id: 'es-business-pitch',
    title: 'Discurso de Ascensor',
    content: `Crea un discurso de ascensor convincente para:

Producto/Servicio: {{producto}}
Audiencia objetivo: {{audiencia}}
Problema clave resuelto: {{problema}}
Propuesta de valor única: {{propuesta_valor}}

El discurso debe ser:
- 30-60 segundos cuando se habla
- Claro y sin jerga
- Memorable y atractivo
- Terminar con una llamada a la acción`,
    tags: ['negocios', 'pitch', 'marketing'],
    category: 'business',
    description: 'Crea discursos de ascensor convincentes',
    language: 'es',
  },
  {
    id: 'es-business-meeting',
    title: 'Agenda de Reunión',
    content: `Crea una agenda de reunión estructurada:

Propósito de la reunión: {{propósito}}
Duración: {{duración}}
Asistentes: {{asistentes}}
Temas clave: {{temas}}

Incluye:
1. Bienvenida y objetivos (asignación de tiempo)
2. Desglose de temas con límites de tiempo
3. Preguntas de discusión para cada tema
4. Sección de elementos de acción
5. Próximos pasos y seguimiento`,
    tags: ['negocios', 'reuniones', 'productividad'],
    category: 'business',
    description: 'Estructura agendas de reunión efectivas',
    language: 'es',
  },
  {
    id: 'es-business-feedback',
    title: 'Retroalimentación Constructiva',
    content: `Ayúdame a proporcionar retroalimentación constructiva sobre:

Situación: {{situación}}
Qué salió bien: {{positivos}}
Áreas de mejora: {{mejoras}}
Contexto de la relación: {{contexto: compañero/subordinado/gerente}}

Crea retroalimentación que sea:
- Específica y accionable
- Equilibrada (positiva y constructiva)
- Enfocada en comportamiento, no personalidad
- Orientada al futuro con sugerencias`,
    tags: ['negocios', 'retroalimentación', 'comunicación'],
    category: 'business',
    description: 'Elabora mensajes de retroalimentación constructiva',
    language: 'es',
  },

  // Plantillas de Aprendizaje
  {
    id: 'es-learning-explain',
    title: 'Explícame Como Si Tuviera 5 Años',
    content: `Explica el siguiente concepto en términos simples que cualquiera pueda entender:

Concepto: {{concepto}}

Usa:
- Lenguaje simple (sin jerga)
- Analogías y ejemplos relacionables
- Desglose paso a paso si aplica
- Descripciones visuales donde ayude

Luego proporciona una explicación ligeramente más avanzada para alguien con conocimiento básico.`,
    tags: ['aprendizaje', 'explicación'],
    category: 'learning',
    description: 'Obtén explicaciones simples de temas complejos',
    language: 'es',
  },
  {
    id: 'es-learning-study',
    title: 'Creador de Guía de Estudio',
    content: `Crea una guía de estudio completa para:

Tema: {{tema}}
Nivel: {{nivel: principiante/intermedio/avanzado}}
Tiempo disponible: {{tiempo}}

Incluye:
1. Conceptos clave y definiciones
2. Hechos importantes a recordar
3. Conceptos erróneos comunes
4. Preguntas de práctica con respuestas
5. Ayudas de memoria y mnemotécnicos
6. Horario de estudio sugerido`,
    tags: ['aprendizaje', 'estudio', 'educación'],
    category: 'learning',
    description: 'Genera guías de estudio para cualquier tema',
    language: 'es',
  },
  {
    id: 'es-learning-quiz',
    title: 'Generador de Cuestionarios',
    content: `Crea un cuestionario para evaluar conocimiento sobre:

Tema: {{tema}}
Dificultad: {{dificultad: fácil/media/difícil}}
Número de preguntas: {{cantidad}}
Tipos de preguntas: {{tipos: opción múltiple/verdadero-falso/respuesta corta}}

Incluye:
1. Preguntas que cubran conceptos clave
2. Clave de respuestas con explicaciones
3. Guía de puntuación
4. Áreas a revisar basadas en errores comunes`,
    tags: ['aprendizaje', 'cuestionario', 'educación'],
    category: 'learning',
    description: 'Crea cuestionarios para evaluar comprensión',
    language: 'es',
  },

  // Plantillas de Productividad
  {
    id: 'es-productivity-breakdown',
    title: 'Desglose de Tareas',
    content: `Desglosa la siguiente tarea en pasos accionables:

Tarea: {{tarea}}
Fecha límite: {{fecha_límite}}
Recursos disponibles: {{recursos}}

Proporciona:
1. Pasos claros y secuenciales
2. Tiempo estimado para cada paso
3. Dependencias entre pasos
4. Posibles bloqueadores y soluciones
5. Hitos para seguimiento del progreso`,
    tags: ['productividad', 'planificación'],
    category: 'productivity',
    description: 'Divide tareas complejas en pasos manejables',
    language: 'es',
  },
  {
    id: 'es-productivity-prioritize',
    title: 'Matriz de Prioridades',
    content: `Ayúdame a priorizar las siguientes tareas:

{{lista_tareas}}

Considera:
- Urgencia y fechas límite
- Importancia e impacto
- Esfuerzo requerido
- Dependencias

Crea una matriz de prioridades (cuadrantes urgente/importante) y sugiere un orden de ejecución con razonamiento.`,
    tags: ['productividad', 'priorización'],
    category: 'productivity',
    description: 'Prioriza tareas usando frameworks probados',
    language: 'es',
  },
  {
    id: 'es-productivity-goals',
    title: 'Establecedor de Metas SMART',
    content: `Ayúdame a crear una meta SMART para:

Meta general: {{meta}}
Plazo: {{plazo}}
Contexto: {{contexto}}

Crea una meta que sea:
- Específica: Claramente definida
- Medible: Con métricas concretas
- Alcanzable: Realista dadas las restricciones
- Relevante: Alineada con objetivos más amplios
- Temporal: Con fechas límite claras

Incluye hitos y criterios de éxito.`,
    tags: ['productividad', 'metas', 'planificación'],
    category: 'productivity',
    description: 'Crea metas bien definidas y alcanzables',
    language: 'es',
  },
  {
    id: 'es-productivity-review',
    title: 'Revisión Semanal',
    content: `Guíame a través de una revisión semanal:

Logros de esta semana: {{logros}}
Desafíos enfrentados: {{desafíos}}
Prioridades próximas: {{prioridades}}

Ayúdame a:
1. Celebrar victorias y progreso
2. Analizar qué funcionó y qué no
3. Extraer lecciones aprendidas
4. Planificar las principales prioridades de la próxima semana
5. Identificar posibles obstáculos y soluciones`,
    tags: ['productividad', 'revisión', 'planificación'],
    category: 'productivity',
    description: 'Estructura revisiones semanales efectivas',
    language: 'es',
  },
];
