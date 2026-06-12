import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { environment } from '@/environments/environment';
import { NgIcon } from '@ng-icons/core';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIcon],
  template: `
    <div class="login-fullscreen">
      <!-- GIF logo centrado arriba -->
      <div class="login-gif">
        <img src="assets/images/GaciLoading.gif" alt="GACI" />
      </div>

      <!-- Form de login -->
      <div class="login-form-wrapper">
        <form [formGroup]="loginForm" (ngSubmit)="login()" class="login-form">
          <div class="mb-3">
            <label for="usuario" class="form-label">Usuario</label>
            <input
              formControlName="usuario"
              type="text"
              class="form-control"
              id="usuario"
              placeholder="Usuario"
              required
            />
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Contraseña</label>
            <div class="input-group">
              <input
                formControlName="password"
                [type]="showPassword() ? 'text' : 'password'"
                class="form-control"
                id="password"
                placeholder="••••••••"
                required
              />
              <button
                class="btn btn-light btn-icon"
                type="button"
                (click)="showPassword.set(!showPassword())"
              >
                <ng-icon
                  name="tablerEye"
                  [class.d-block]="showPassword()"
                  [class.d-none]="!showPassword()"
                ></ng-icon>
                <ng-icon
                  name="tablerEyeClosed"
                  [class.d-block]="!showPassword()"
                  [class.d-none]="showPassword()"
                ></ng-icon>
              </button>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="recordar"
                formControlName="recordar"
              />
              <label class="form-check-label" for="recordar">Recordarme</label>
            </div>
          </div>

          @if (errorMsg()) {
            <div class="alert alert-danger py-2 mb-3">{{ errorMsg() }}</div>
          }

          <div class="d-grid">
            <button
              type="submit"
              class="btn btn-primary fw-semibold py-2"
              [disabled]="loading()"
            >
              @if (loading()) {
                <span>Ingresando...</span>
              } @else {
                <span>Iniciar Sesión</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: `
    .login-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      z-index: 100;
    }

    .login-gif {
      margin-bottom: 2rem;
      animation: fadeIn 0.5s ease-out;
    }

    .login-gif img {
      width: 120px;
      height: auto;
    }

    .login-form-wrapper {
      width: 100%;
      max-width: 380px;
      animation: slideUp 0.4s ease-out 0.2s both;
    }

    .login-form {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2rem;
    }

    .form-label {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }

    .form-control {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 0.75rem 1rem;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      &:focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.4);
        box-shadow: none;
        color: #fff;
      }
    }

    .input-group .btn-light {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.7);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
    }

    .form-check-input {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);

      &:checked {
        background-color: #e94560;
        border-color: #e94560;
      }
    }

    .form-check-label {
      color: rgba(255, 255, 255, 0.7);
    }

    .btn-primary {
      background: #e94560;
      border-color: #e94560;

      &:hover {
        background: #d63d56;
        border-color: #d63d56;
      }

      &:disabled {
        background: #e94560;
        opacity: 0.6;
      }
    }

    .alert-danger {
      background: rgba(233, 69, 96, 0.2);
      border: 1px solid rgba(233, 69, 96, 0.4);
      color: #ff8a9b;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  showPassword = signal(false);
  loading = signal(false);
  errorMsg = signal('');

  loginForm = new FormGroup({
    usuario: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    recordar: new FormControl(true),
  });

  ngOnInit(): void {
    // Si ya tiene sesión válida, redirigir a gem-web
    this.authService.verifyToken().subscribe(isValid => {
      if (isValid) {
        window.location.href = environment.GEM_WEB_URL;
      }
    });
  }

  login(): void {
    const { usuario, password, recordar } = this.loginForm.value;
    if (!usuario || !password) {
      this.errorMsg.set('Ingresá usuario y contraseña');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const credentials = { email: usuario, password };
    this.authService.login(credentials, !!recordar).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: () => {
        this.errorMsg.set('Credenciales inválidas');
      },
    });
  }
}