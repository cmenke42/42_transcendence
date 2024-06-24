import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import GameScene from './game/scene/GameScene';
import * as THREE from 'three';

@Component({
  selector: 'app-local-match-component',
  templateUrl: './local-match-component.component.html',
  styleUrls: ['./local-match-component.component.css']
})
export class LocalMatchComponentComponent implements OnInit, AfterViewInit
{
  @ViewChild('gameContainer', {static: true}) gameContainer!: ElementRef<HTMLDivElement>;
  constructor() {}

  ngOnInit(): void {}
  async ngAfterViewInit(): Promise<void>
  {
    const gameElement = this.gameContainer.nativeElement;
    GameScene.getInstance().initilize(gameElement);
    await GameScene.getInstance().load();
    GameScene.getInstance().render();
  }
}
