/* tslint:disable:no-unused-variable */

import { Component, Provider, ViewChild, NgZone } from '@angular/core';
import { Gateway } from '../../shared/gateways/base.gateway';
import { WebRTCGateway } from '../gateways/webrtc.gateway';
import { WebSocketGateway, WebSocketGatewayConfig, WS_CONFIG } from '../gateways/websocket.gateway';
import { WS_PORT, WS_SECURE, WS_HOST, GAME_TEXT } from '../../config/config';
import { GameComponent } from '../../shared/components/game/game.component';
import { AsyncService } from '../../shared/async-services/base.async-service';
import { GameModel } from '../../shared/models/game.model';
import { P2PGameModel } from '../models/p2p-game.model';
import { GameServer } from '../../shared/async-services/game-server/game-server.async-service';
import { GameP2PService } from '../async-services/p2p-service/game-p2p.async-service';

import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/take';

const WSConfig: WebSocketGatewayConfig = {
  port: WS_PORT,
  secure: WS_SECURE,
  host: WS_HOST
};

const providers: Provider[] = [

  // Here we override the AsyncService multi-provider and
  // introduce the GameP2PService service.
  // This way we're using both GameServer and
  // GameP2PService and so the user can send progress to both
  // the application server and the user she is connected with.
  { provide: AsyncService, multi: true, useClass: GameServer },
  { provide: AsyncService, multi: true, useClass: GameP2PService },

  // Without lazy-loading it doesn't matter where we declare
  // the WebRTCGateway, Gateway and WS_CONFIG. However, notice that
  // these provider are required by the GameP2PService
  // so they should be available in the part of the component tree where
  // we want to render the MultiPlayerComponent.
  { provide: Gateway, useClass: WebRTCGateway },
  { provide: WebRTCGateway, useExisting: Gateway },
  { provide: WS_CONFIG, useValue: WSConfig },

  GameModel,
  WebSocketGateway,
  P2PGameModel
];

@Component({
  selector: 'sd-about',
  moduleId: module.id,
  templateUrl: 'multi-player.component.html',
  styleUrls: ['multi-player.component.css'],
  providers
})
export class MultiPlayerComponent {
  timeLeft: number = 3;
  playerJoined: boolean = false;
  won: boolean = false;
  @ViewChild(GameComponent) game: GameComponent;

  private _timer: any;
  private text = GAME_TEXT;
  private gameEnabled: boolean = false;
  private gamePlayed: boolean = false;

  constructor(private _gateway: WebRTCGateway, private _zone: NgZone, private _p2pModel: P2PGameModel) {
    this._gateway.connectionEvents.filter((e: boolean) => e)
      .subscribe(() => {
        this.playerJoined = true;
        this._start();
      });
  }

  gameCompleted(time: number) {
    this.game.reset();
    this.won = true;
    // this._p2pModel.completeGame(time, this.text);
  }

  partnerText() {
    return this._gameModel()
      .map((game: any) => game.get('partnerProgress'));
  }

  partnerCompleted() {
    return this._gameModel()
      .map((game: any) => !!game.get('partnerCompleted'));
  }

  _gameModel() {
    return this._p2pModel.p2pGame$
      .filter((game: any) => game && typeof game.get === 'function');
  }

  private _start() {
    this._zone.run(() => {
      this._timer = Observable
        .interval(1000)
        .take(4)
        .map((num: number) => 3 - num)
        .subscribe((time: number) => {
          this.timeLeft = time;
        }, null, () => {
          console.log('Started!');
          this.gameEnabled = true;
        });
    });
    this.gamePlayed = true;
  }
}
