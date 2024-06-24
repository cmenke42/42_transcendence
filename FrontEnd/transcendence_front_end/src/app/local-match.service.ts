import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class LocalMatchService {

  private apiUrl = 'http://localhost:8001/api/v1/';

  constructor(private http: HttpClient) { }
  getAll(): Observable<any> {
    return this.http.get<any[]>(this.apiUrl);
  }
  getOne(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + id);
  }
  createOne(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
  updateOne(id: number, data: any): Observable<any> {
    return this.http.put<any>(this.apiUrl + id, data);
  }
  deleteOne(id: number): Observable<any> {
    return this.http.delete<any>(this.apiUrl + id);
  }
}
