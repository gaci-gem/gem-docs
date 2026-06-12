# Componente Standalone Milkdown

Un componente Angular standalone completo para integrar el editor Milkdown en cualquier proyecto Angular.

## Características

✨ **Componente Standalone**: No requiere módulos adicionales
🎨 **Totalmente Personalizable**: Configuración flexible de características y estilos
📝 **Reactive Forms**: Compatible con Angular Reactive Forms (ControlValueAccessor)
🎯 **TypeScript**: Completamente tipado con interfaces TypeScript
📱 **Responsive**: Diseño adaptable para móviles y escritorio
🌙 **Dark Mode**: Soporte automático para modo oscuro
⚡ **Liviano**: Todas las dependencias incluidas en el componente

## Instalación

### Paso 1: Copiar archivos
Copia estos archivos a tu proyecto:
```
standalone-milkdown/
├── standalone-milkdown.component.ts
├── standalone-milkdown.component.scss
└── README.md
```

### Paso 2: Instalar dependencias
```bash
npm install @milkdown/crepe
```

### Paso 3: Importar en tu componente
```typescript
import { StandaloneMilkdownComponent } from './path/to/standalone-milkdown/standalone-milkdown.component';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [StandaloneMilkdownComponent], // Agregar aquí
  template: `
    <standalone-milkdown 
      [config]="editorConfig"
      (contentChange)="onContentChange($event)">
    </standalone-milkdown>
  `
})
export class ExampleComponent {
  editorConfig = {
    height: '400px',
    maxWidth: '800px',
    readonly: false
  };

  onContentChange(content: string) {
    console.log('Contenido actualizado:', content);
  }
}
```

## Uso Básico

### Ejemplo Simple
```html
<standalone-milkdown></standalone-milkdown>
```

### Con Configuración
```html
<standalone-milkdown 
  [config]="editorConfig"
  [showControls]="true"
  [showStatus]="true"
  [initialValue]="initialContent"
  (contentChange)="onContentChange($event)"
  (ready)="onEditorReady()">
</standalone-milkdown>
```

### Con Reactive Forms
```typescript
import { FormBuilder, FormGroup } from '@angular/forms';

export class MyComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      content: ['# Mi contenido inicial']
    });
  }
}
```

```html
<form [formGroup]="form">
  <standalone-milkdown 
    formControlName="content"
    [config]="{ height: '500px' }">
  </standalone-milkdown>
</form>
```

## API del Componente

### Inputs

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `config` | `MilkdownConfig` | `{}` | Configuración del editor |
| `showControls` | `boolean` | `true` | Mostrar barra de controles |
| `showStatus` | `boolean` | `true` | Mostrar barra de estado |
| `disabled` | `boolean` | `false` | Deshabilitar editor |
| `initialValue` | `string` | `''` | Valor inicial |

### Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `contentChange` | `string` | Se emite cuando cambia el contenido |
| `focusEvent` | `void` | Se emite cuando el editor recibe foco |
| `blurEvent` | `void` | Se emite cuando el editor pierde foco |
| `ready` | `void` | Se emite cuando el editor está listo |

### Interfaz MilkdownConfig

```typescript
interface MilkdownConfig {
  placeholder?: string;        // Texto placeholder
  readonly?: boolean;          // Solo lectura
  height?: string;            // Altura mínima (ej: '400px')
  maxWidth?: string;          // Ancho máximo (ej: '900px')
  features?: {
    toolbar?: boolean;         // Barra de herramientas
    table?: boolean;          // Soporte para tablas
    linkTooltip?: boolean;    // Tooltips de enlaces
    imageBlock?: boolean;     // Bloques de imagen
    blockEdit?: boolean;      // Edición de bloques
    listItem?: boolean;       // Elementos de lista
    cursor?: boolean;         // Cursor personalizado
    placeholder?: boolean;    // Placeholder
    latex?: boolean;          // Soporte LaTeX
    codeMirror?: boolean;     // Editor de código
  };
}
```

## Métodos Públicos

```typescript
// Obtener referencia del componente
@ViewChild(StandaloneMilkdownComponent) editor!: StandaloneMilkdownComponent;

// Métodos disponibles
this.editor.getMarkdown();           // Obtener contenido Markdown
this.editor.setMarkdown(content);    // Establecer contenido
this.editor.setReadonly(true);       // Cambiar modo lectura
this.editor.toggleReadonly();        // Alternar modo lectura
this.editor.clearContent();          // Limpiar contenido
this.editor.exportMarkdown();        // Exportar a archivo
this.editor.focusEditor();          // Enfocar editor
this.editor.blurEditor();           // Desenfocar editor
this.editor.isReady();              // Verificar si está listo
```

## Ejemplos de Uso

### Editor Básico con Validación
```typescript
@Component({
  template: `
    <form [formGroup]="documentForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label>Contenido del Documento</label>
        <standalone-milkdown 
          formControlName="content"
          [config]="editorConfig"
          (contentChange)="onContentChange($event)">
        </standalone-milkdown>
        <div *ngIf="contentErrors" class="error">
          {{ contentErrors }}
        </div>
      </div>
      
      <button type="submit" [disabled]="documentForm.invalid">
        Guardar Documento
      </button>
    </form>
  `
})
export class DocumentEditorComponent {
  documentForm = this.fb.group({
    content: ['', [Validators.required, Validators.minLength(10)]]
  });

  editorConfig: MilkdownConfig = {
    height: '400px',
    placeholder: 'Escribe tu documento aquí...',
    features: {
      toolbar: true,
      table: true,
      imageBlock: true,
      latex: true
    }
  };

  get contentErrors() {
    const control = this.documentForm.get('content');
    if (control?.errors?.['required']) return 'El contenido es requerido';
    if (control?.errors?.['minlength']) return 'Mínimo 10 caracteres';
    return null;
  }

  onContentChange(content: string) {
    console.log('Caracteres:', content.length);
  }

  onSubmit() {
    if (this.documentForm.valid) {
      console.log('Documento:', this.documentForm.value);
    }
  }
}
```

### Editor Solo Lectura con Exportación
```typescript
@Component({
  template: `
    <div class="document-viewer">
      <h2>{{ document.title }}</h2>
      
      <standalone-milkdown 
        [config]="viewerConfig"
        [initialValue]="document.content"
        [showControls]="false">
      </standalone-milkdown>
      
      <div class="actions">
        <button (click)="exportDocument()">
          📄 Exportar PDF
        </button>
        <button (click)="editDocument()" *ngIf="canEdit">
          ✏️ Editar
        </button>
      </div>
    </div>
  `
})
export class DocumentViewerComponent {
  @Input() document: any;
  @Input() canEdit = false;

  viewerConfig: MilkdownConfig = {
    readonly: true,
    height: '500px',
    features: {
      toolbar: false,
      blockEdit: false
    }
  };

  exportDocument() {
    // Lógica de exportación
  }

  editDocument() {
    // Cambiar a modo edición
  }
}
```

### Editor Colaborativo
```typescript
@Component({
  template: `
    <div class="collaborative-editor">
      <div class="editor-header">
        <span>Editando: {{ documentName }}</span>
        <span class="users">{{ activeUsers }} usuarios conectados</span>
      </div>
      
      <standalone-milkdown 
        [config]="collaborativeConfig"
        (contentChange)="onContentChange($event)"
        (ready)="onEditorReady()">
      </standalone-milkdown>
      
      <div class="editor-footer">
        <span>Auto-guardado: {{ lastSaved | date:'short' }}</span>
      </div>
    </div>
  `
})
export class CollaborativeEditorComponent {
  documentName = 'Documento compartido';
  activeUsers = 3;
  lastSaved = new Date();

  collaborativeConfig: MilkdownConfig = {
    height: '600px',
    features: {
      toolbar: true,
      table: true,
      imageBlock: true,
      blockEdit: true
    }
  };

  onContentChange(content: string) {
    // Sincronizar con otros usuarios
    this.syncWithServer(content);
  }

  onEditorReady() {
    // Configurar colaboración en tiempo real
    this.setupCollaboration();
  }

  private syncWithServer(content: string) {
    // Implementar sincronización
  }

  private setupCollaboration() {
    // Configurar WebSocket para colaboración
  }
}
```

## Personalización de Estilos

El componente usa variables CSS que puedes personalizar:

```css
:root {
  --milkdown-primary: #3b82f6;
  --milkdown-primary-hover: #2563eb;
  --milkdown-border: #e2e8f0;
  --milkdown-bg: #ffffff;
  --milkdown-text: #374151;
  /* ... más variables */
}

/* Personalización específica */
standalone-milkdown {
  .milkdown-wrapper {
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .control-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
}
```

## Troubleshooting

### Problemas Comunes

1. **Editor no se inicializa**
   - Verifica que `@milkdown/crepe` esté instalado
   - Asegúrate de que el componente esté importado correctamente

2. **Estilos no se aplican**
   - Verifica que el archivo SCSS esté en la misma carpeta
   - Revisa la ruta en `styleUrls`

3. **Errores de TypeScript**
   - Asegúrate de tener las últimas versiones de Angular
   - Verifica que todas las interfaces estén importadas

### Dependencias Requeridas

```json
{
  "@milkdown/crepe": "^1.x.x",
  "@angular/core": "^17.x.x",
  "@angular/common": "^17.x.x",
  "@angular/forms": "^17.x.x"
}
```

## Licencia

Este componente es de uso libre. Puedes modificarlo y distribuirlo según tus necesidades.

## Contribuciones

Si encuentras errores o quieres mejorar el componente, las contribuciones son bienvenidas.