# 🚀 Instrucciones de Instalación - Componente Standalone Milkdown

## ✅ Pasos para copiar a tu sistema

### 1. Copiar archivos del componente
Copia toda la carpeta `standalone-milkdown` a tu proyecto:

```
tu-proyecto/src/app/components/standalone-milkdown/
├── standalone-milkdown.component.ts      # Componente principal
├── standalone-milkdown.component.scss    # Estilos
├── example-usage.component.ts            # Ejemplos de uso (opcional)
├── index.ts                             # Archivo de exportaciones
├── package.json                         # Metadatos del componente
├── README.md                            # Documentación completa
└── INSTALL.md                           # Este archivo
```

### 2. Instalar dependencias
```bash
npm install @milkdown/crepe
```

### 3. Uso básico en tu componente

```typescript
// mi-componente.ts
import { Component } from '@angular/core';
import { StandaloneMilkdownComponent, MilkdownConfig } from './path/to/standalone-milkdown';

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [StandaloneMilkdownComponent],
  template: `
    <standalone-milkdown 
      [config]="editorConfig"
      (contentChange)="onContentChange($event)">
    </standalone-milkdown>
  `
})
export class MiComponente {
  editorConfig: MilkdownConfig = {
    height: '400px',
    features: {
      toolbar: true,
      table: true,
      imageBlock: true
    }
  };

  onContentChange(content: string) {
    console.log('Contenido:', content);
  }
}
```

### 4. Uso con Reactive Forms

```typescript
// formulario.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StandaloneMilkdownComponent } from './path/to/standalone-milkdown';

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [ReactiveFormsModule, StandaloneMilkdownComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <standalone-milkdown 
        formControlName="content"
        [config]="{ height: '300px' }">
      </standalone-milkdown>
      
      <button type="submit">Guardar</button>
    </form>
  `
})
export class FormularioComponent {
  form = this.fb.group({
    content: ['# Mi contenido inicial']
  });

  constructor(private fb: FormBuilder) {}

  onSubmit() {
    console.log(this.form.value);
  }
}
```

### 5. Configuración avanzada

```typescript
// editor-avanzado.component.ts
export class EditorAvanzadoComponent {
  @ViewChild(StandaloneMilkdownComponent) editor!: StandaloneMilkdownComponent;

  editorConfig: MilkdownConfig = {
    height: '500px',
    maxWidth: '800px',
    placeholder: 'Escribe tu documento aquí...',
    readonly: false,
    features: {
      toolbar: true,
      table: true,
      linkTooltip: true,
      imageBlock: true,
      blockEdit: true,
      listItem: true,
      cursor: true,
      placeholder: true,
      latex: true,
      codeMirror: true
    }
  };

  // Métodos para interactuar con el editor
  exportarContenido() {
    this.editor.exportMarkdown();
  }

  limpiarEditor() {
    this.editor.clearContent();
  }

  modoSoloLectura() {
    this.editor.setReadonly(true);
  }

  obtenerMarkdown(): string {
    return this.editor.getMarkdown();
  }
}
```

## 🎨 Personalización de Estilos

Para personalizar los estilos, puedes:

### Opción 1: Variables CSS globales
```css
/* styles.css global */
:root {
  --milkdown-primary: #your-color;
  --milkdown-border: #your-border;
  --milkdown-bg: #your-background;
}
```

### Opción 2: Estilos específicos del componente
```scss
// tu-componente.scss
standalone-milkdown {
  .milkdown-wrapper {
    border: 2px solid #your-color;
    border-radius: 12px;
  }

  .control-btn {
    background: linear-gradient(45deg, #color1, #color2);
  }
}
```

## 🔧 Configuración TypeScript

Si usas TypeScript estricto, asegúrate de tener estas configuraciones:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictTemplates": true,
    "skipLibCheck": true
  }
}
```

## 📦 Dependencias Requeridas

```json
{
  "dependencies": {
    "@angular/core": "^17.0.0",
    "@angular/common": "^17.0.0", 
    "@angular/forms": "^17.0.0",
    "@milkdown/crepe": "^1.0.0"
  }
}
```

## 🚨 Troubleshooting

### Error: "Can't resolve @milkdown/crepe"
```bash
npm install @milkdown/crepe --save
```

### Error: "Module not found"
Verifica que la ruta de importación sea correcta:
```typescript
import { StandaloneMilkdownComponent } from './ruta/correcta/standalone-milkdown';
```

### Editor no se muestra
1. Verifica que el componente esté en `imports`
2. Revisa la consola del navegador para errores
3. Asegúrate de que el contenedor tenga altura mínima

### Estilos no se aplican
1. Verifica que el archivo `.scss` esté en la misma carpeta
2. Revisa que `styleUrls` tenga la ruta correcta
3. Asegúrate de que no haya conflictos de CSS

## 📋 Checklist de Instalación

- [ ] Copiar carpeta `standalone-milkdown` al proyecto
- [ ] Instalar `@milkdown/crepe`
- [ ] Importar componente en donde lo uses
- [ ] Agregar al array `imports`
- [ ] Configurar según tus necesidades
- [ ] Probar funcionalidad básica
- [ ] Personalizar estilos (opcional)

## 🎯 Próximos Pasos

1. **Prueba el componente**: Usa el archivo `example-usage.component.ts` como referencia
2. **Personaliza**: Ajusta la configuración según tus necesidades
3. **Integra**: Conecta con tu backend/API
4. **Optimiza**: Ajusta características según el rendimiento
5. **Documenta**: Crea documentación específica para tu equipo

## 💡 Consejos

- ✅ El componente es standalone, no necesita módulos
- ✅ Compatible con Angular 17+ y Reactive Forms
- ✅ Funciona con SSR (Server-Side Rendering)
- ✅ Responsive por defecto
- ✅ Soporte para modo oscuro automático
- ✅ TypeScript completamente tipado

¡Disfruta usando el componente! 🎉