// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create, Options } from 'canvas-confetti';

const confettiObject = create(undefined, { useWorker: true, resize: true });

export class ConfettiService {
    confettiCannon() {
      this.fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      this.fire(0.2, {
        spread: 60,
      });
      this.fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      this.fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      this.fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  
    private fire(particleRatio: number, opts: Options) {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
      };
  
      confettiObject(
        Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio),
        })
      );
    }
  }
  