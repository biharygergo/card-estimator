import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { articleResolver } from './article.resolver';
import { Article } from './types';

describe('articleResolver', () => {
  const executeResolver: ResolveFn<Article> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() => articleResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
