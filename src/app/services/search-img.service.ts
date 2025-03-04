import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export type Filter = {
  type: string;
  value: string;
};

@Injectable({
  providedIn: 'root'
})
export class SearchImgService {
  private url = 'http://127.0.0.1:1880/filter';

  constructor(private http: HttpClient) { }

  searchImg(filter: Filter) {
    return this.http.post(this.url, { filter });
  }
}
