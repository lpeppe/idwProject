import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ShareService } from './share-service';
import { CacheService } from "ionic-cache";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/toPromise';
import * as socketIo from 'socket.io-client';

/*
  Generated class for the WebScraper provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/

@Injectable()
export class WebScraper {
  hostname: string;
  pdPromise: any;
  luoghiPromise: any;
  ristPromise: any;
  qcPromise: any;
  socket: any;
  constructor(public http: Http, public share: ShareService, private cache: CacheService) {
    this.hostname = 'http://ec2-34-211-229-249.us-west-2.compute.amazonaws.com';
    this.socket = socketIo(this.hostname + ':8090');
  }

  getRevData(lat: any, lng: any) {
    this.socket.emit('getRevData', {
      lat: lat,
      lng: lng
    })
    this.share.setLat(lat);
    this.share.setLng(lng);
    this.generatePromises();
    this.share.setPlaceSelected();
  }

  getData(placeid: string) {
    this.socket.emit('getData', {
      placeid: placeid
    })
    this.generatePromises();
    this.share.setPlaceSelected();
  }

  generatePromises() {
    this.pdPromise = new Promise((resolve, reject) => {
      this.socket.on('placeDetails', (data) => {
        var data = JSON.parse(data);
        resolve(data)
        this.share.setLat(data.lat);
        this.share.setLng(data.lng);
        this.share.setCitta(data.citta);
      })
    })
    this.ristPromise = new Promise((resolve, reject) => {
      this.socket.on('ristoranti', (data) => resolve(JSON.parse(data)))
    })
    this.qcPromise = new Promise((resolve, reject) => {
      this.socket.on('qc', (data) => resolve(data))
    })
    this.luoghiPromise = new Promise((resolve, reject) => {
      this.socket.on('taAttr', (data) => resolve(JSON.parse(data)))
    })
  }

  getProdottiTipici() {
    // return this.http.get(this.hostname + ':8090/qc?regione=' + this.share.regione.toLowerCase()).map(res => res.json()).retry(2);
    let request = this.http.get(this.hostname + ':8090/qc?regione=' + this.share.regione.toLowerCase()).map(res => res.json()).retry(2);
    return this.cache.loadFromObservable(this.share.regione.toLowerCase(), request);
  }

  getDescrProdottiTipici(link) {
    // return this.http.get(this.hostname + ':8090/qcpage?link=' + link).map(res => res.json()).retry(2);
    let request = this.http.get(this.hostname + ':8090/qcpage?link=' + link).map(res => res.json()).retry(2);
    return this.cache.loadFromObservable(link, request);
  }

  getLuoghi() {
    this.luoghiPromise = this.http.get(this.hostname + ':8090/taattr?loc=' + this.share.citta).map(res => res.json()).retry().toPromise();
  }

  getLuoghiPromise() {
    return this.luoghiPromise;
  }

  getRistPromise() {
    return this.ristPromise;
  }

  getPdPromise() {
    return this.pdPromise;
  }

  getQcPromise() {
    return this.qcPromise;
  }

  getNextLuoghi(placeid: string, page: number) {
    return this.http.get(this.hostname + ':8090/taattr?placeid=' + placeid + '&page=' + page).map(res => res.json()).retry();
  }

  getRistoranti(radius: number) {
    let request = this.http.get(this.hostname + ':8090/ris?lat=' + this.share.getLat() + '&lng=' + this.share.getLng() + '&radius=' + radius).map(res => res.json()).retry(2);
    return this.cache.loadFromObservable(this.share.getLat() + "-" + this.share.getLng(), request);
  }

  getDescrRistoranti(place_id: string) {
    return this.http.get(this.hostname + ':8090/risdescr?placeid=' + place_id).map(res => res.json()).retry(2);
  }

  getTaReviews(ris: string) {
    let request = this.http.get(this.hostname + ':8090/tarev?ris=' + ris + '&citta=' + this.share.getProvincia()).map(res => res.json()).retry();
    return this.cache.loadFromObservable(ris + "-" + this.share.getProvincia(), request);
    // return this.http.get(this.hostname + ':8090/tarev?ris=' + ris + '&citta=' + this.share.getProvincia()).map(res => res.json()).retry();
  }

  getTaNextPage(place_id: string, ris_id: string, page: number) {
    return this.http.get(this.hostname + ':8090/tarev?placeid=' + place_id + '&risid=' + ris_id + "&page=" + page).map(res => res.json()).retry();
  }

  getPlaceDetails(place_id: string) {
    return this.http.get(this.hostname + ':8090/placedet?placeid=' + place_id).map(res => res.json()).retry(2);
  }

  getReverseGeocoding(lat: any, lng: any) {
    return this.http.get(this.hostname + ':8090/placedetrev?lat=' + lat + "&lng=" + lng).map(res => res.json()).retry(2);
  }

  getDescrAttrazioni(attr: string) {
    // return this.http.get(this.hostname + ':8090/wiki?loc=' + this.share.citta.toLowerCase() + '&attr=' + attr).map(res => res.json());
    let request = this.http.get(this.hostname + ':8090/wiki?loc=' + this.share.citta.toLowerCase() + '&attr=' + attr).map(res => res.json());
    return this.cache.loadFromObservable(this.share.citta.toLowerCase() + "-" + attr, request);
  }

  getSagre(regione: string, provincia: string, mese: string, index: number) {
    console.log('num = ' + index)
    // return this.http.get(this.hostname + ':3000/sagre?regione='+regione+'&provincia='+provincia+'&mese='+mese+'&num='+index).map(res => res.json());
    return this.http.get(this.hostname + ':8090/sagre?regione=' + this.share.getRegione() + '&provincia=' + this.share.getProvincia() + '&mese=' + mese + '&num=' + index).map(res => res.json());
  }

  getDescrSagre(url: string) {
    // return this.http.get(this.hostname + ':8081/descr?url=' + url).map(res => res.json());
    return this.http.get(this.hostname + ':8090/sagredescr?url=' + url).map(res => res.json());
  }

}
