import { MessageService } from 'primeng/api';

const TIME_SHOW = 3000;


export function showSuccess(messageService: MessageService, summary: string, detail: string) {
  messageService.add({ severity: 'success', summary, detail });
}
export function showError(messageService: MessageService, summary: string, detail: string) {
  messageService.add({ severity: 'error', summary, detail });
}
export function showWarn(messageService: MessageService, summary: string, detail: string) {
  messageService.add({ severity: 'warn', summary, detail });
}
export function showInfo(messageService: MessageService, summary: string, detail: string) {
  messageService.add({ severity: 'info', summary, detail });
}

export function showSuccessToast(messageService: MessageService, summary: string, detail: string, key: string = 'br') {
  messageService.add({ severity: 'success', summary, detail, key, life: TIME_SHOW });
}
export function showWarnToast(messageService: MessageService, summary: string, detail: string, key: string = 'br') {
  messageService.add({ severity: 'warn', summary, detail, key, life: TIME_SHOW });
}
export function showInfoToast(messageService: MessageService, summary: string, detail: string, key: string = 'br') {
  messageService.add({ severity: 'info', summary, detail, key, life: TIME_SHOW });
}
export function showErrorToast(messageService: MessageService, summary: string, detail: string, key: string = 'br') {
  messageService.add({ severity: 'error', summary, detail, key, life: TIME_SHOW+1000 });
}

