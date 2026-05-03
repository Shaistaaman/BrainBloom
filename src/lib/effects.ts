import confetti from 'canvas-confetti';

const SOUNDS = {
  CORRECT: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  WRONG: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
  LEVEL_UP: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
};

export function playSound(type: keyof typeof SOUNDS) {
  const audio = new Audio(SOUNDS[type]);
  audio.play().catch(e => console.warn('Audio play blocked:', e));
}

export function triggerLevelUpConfetti() {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

export function triggerSuccessConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}
