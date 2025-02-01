import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SchemaTagService {
  constructor(@Inject(DOCUMENT) private _document: Document) {}

  public setJsonLd(renderer2: Renderer2, data: any): void {
    let script = renderer2.createElement('script');
    script.type = 'application/ld+json';
    script.text = `${JSON.stringify(data)}`;
    script.setAttribute('class', 'structured-data-markup');

    // Remove existing elements
    const existing = this._document.querySelector('script.structured-data-markup');
    if (existing) {
      renderer2.removeChild(this._document.body, existing);
    }
    const defaultData = this._document.querySelector('script.default-structured-data');
    if (defaultData) {
      renderer2.removeChild(this._document.body, defaultData);
    }

    renderer2.appendChild(this._document.head, script);
  }
}
