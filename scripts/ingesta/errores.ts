/** Error esperado de la ingesta: se informa con su código y sin stack trace. */
export class ErrorIngesta extends Error {
  readonly codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorIngesta';
    this.codigo = codigo;
  }
}
