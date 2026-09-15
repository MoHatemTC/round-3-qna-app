export const quizRecords = [
  {
    key: "typescript",
    title: "TypeScript Foundations",
    description: "Types, narrowing, generics, and modern TypeScript patterns.",
    duration_minutes: 35,
    questions: [
      [
        "Which keyword creates a type alias?",
        ["type", "alias", "typedef", "shape"],
        0
      ],
      [
        "What does a union type describe?",
        [
          "One of several allowed types",
          "Only object types",
          "A runtime class",
          "A database relation"
        ],
        0
      ],
      [
        "Which operator performs optional chaining?",
        ["?.", "??", "::", "=>"],
        0
      ],
      [
        "What does `unknown` require before most operations?",
        ["Type narrowing", "A constructor", "A decorator", "A cast to any"],
        0
      ],
      [
        "Which utility type makes every property optional?",
        ["Partial<T>", "Optional<T>", "Maybe<T>", "Loose<T>"],
        0
      ],
      [
        "What is a generic primarily used for?",
        [
          "Reusable type-safe code",
          "Encrypting values",
          "Creating database indexes",
          "Loading modules"
        ],
        0
      ],
      [
        "Which keyword marks a class property as read-only?",
        ["readonly", "constant", "fixed", "immutable"],
        0
      ],
      [
        "What does type inference do?",
        [
          "Derives types from values and usage",
          "Runs tests",
          "Validates JSON",
          "Compiles SQL"
        ],
        0
      ],
      [
        "Which type represents a function that never returns?",
        ["never", "void", "undefined", "empty"],
        0
      ],
      [
        "What does `as const` commonly provide?",
        [
          "Narrow literal types",
          "Runtime freezing",
          "A constant variable",
          "Deep cloning"
        ],
        0
      ]
    ]
  },
  {
    key: "nestjs",
    title: "NestJS Backend Essentials",
    description:
      "Modules, controllers, providers, validation, and request flow.",
    duration_minutes: 40,
    questions: [
      [
        "What is a NestJS module used to group?",
        [
          "Related controllers and providers",
          "Only database rows",
          "CSS classes",
          "HTTP headers"
        ],
        0
      ],
      [
        "Which decorator defines a controller?",
        ["@Controller", "@Route", "@Handler", "@Endpoint"],
        0
      ],
      [
        "What is dependency injection used for?",
        [
          "Supplying class dependencies",
          "Parsing JSON",
          "Hashing passwords",
          "Starting a browser"
        ],
        0
      ],
      [
        "Which pipe is commonly used for DTO validation?",
        ["ValidationPipe", "DtoPipe", "SchemaPipe", "CheckPipe"],
        0
      ],
      [
        "What does a provider usually contain?",
        [
          "Reusable injectable logic",
          "Static HTML",
          "A database table",
          "A JWT token"
        ],
        0
      ],
      [
        "Which decorator handles a GET route?",
        ["@Get", "@Fetch", "@Read", "@HttpGetOnly"],
        0
      ],
      [
        "What is a guard responsible for?",
        [
          "Allowing or denying request execution",
          "Formatting responses",
          "Migrating tables",
          "Rendering JSX"
        ],
        0
      ],
      [
        "Which NestJS feature transforms incoming values?",
        ["Pipes", "Modules", "Adapters", "Schemas"],
        0
      ],
      [
        "What is an interceptor able to do?",
        [
          "Run logic before and after handlers",
          "Define SQL columns",
          "Create browser cookies only",
          "Replace TypeScript"
        ],
        0
      ],
      [
        "Which class commonly bootstraps a NestJS app?",
        ["NestFactory", "NestLoader", "AppStarter", "NestRuntime"],
        0
      ]
    ]
  },
  {
    key: "prisma",
    title: "Prisma ORM and Data Modeling",
    description:
      "Prisma schemas, relations, queries, migrations, and safe writes.",
    duration_minutes: 45,
    questions: [
      [
        "Which file commonly defines Prisma models?",
        ["schema.prisma", "models.prisma.ts", "database.schema", "prisma.json"],
        0
      ],
      [
        "What does `findUnique` require?",
        [
          "A unique selector",
          "A raw SQL string",
          "A transaction only",
          "A migration name"
        ],
        0
      ],
      [
        "What does `upsert` combine?",
        [
          "Update and create",
          "Read and delete",
          "Connect and disconnect",
          "Migrate and reset"
        ],
        0
      ],
      [
        "What does a relation field represent?",
        [
          "A link between models",
          "A computed CSS value",
          "A server port",
          "A password hash"
        ],
        0
      ],
      [
        "Which Prisma API runs several operations atomically?",
        ["$transaction", "$atomic", "$batchOnly", "$commit"],
        0
      ],
      [
        "What does `include` commonly control?",
        [
          "Related records returned with a query",
          "Database credentials",
          "Migration order",
          "Index names"
        ],
        0
      ],
      [
        "What does a composite unique constraint enforce?",
        [
          "Uniqueness across a field combination",
          "Uniqueness of all rows",
          "Foreign-key deletion",
          "Automatic hashing"
        ],
        0
      ],
      [
        "What is a Prisma migration for?",
        [
          "Tracking database schema changes",
          "Caching query results",
          "Validating DTOs",
          "Issuing JWTs"
        ],
        0
      ],
      [
        "What does `onDelete: Cascade` mean?",
        [
          "Related records are deleted with the parent",
          "Queries are retried",
          "Deletes are blocked",
          "Rows are archived"
        ],
        0
      ],
      [
        "Why use a driver adapter with Prisma 7?",
        [
          "To connect Prisma to the database driver",
          "To define React routes",
          "To generate passwords",
          "To replace the schema"
        ],
        0
      ]
    ]
  }
] as const;
