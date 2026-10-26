import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGear,
  calculateRpm,
  calculateLeanAngleDeg,
  calculateAnswerScore,
  calculateAccuracy,
  randomizeQuestion,
  calculateGripFactor,
  shouldEmitKneeSparks,
  shouldEmitTireSmoke,
  getEffectiveTopSpeed,
} from './rules.ts';

test('calculateGear returns N when stopped and correct gears 1-6 across speed ranges', () => {
  assert.equal(calculateGear(0), 'N');
  assert.equal(calculateGear(5), 'N');
  assert.equal(calculateGear(50), 1);
  assert.equal(calculateGear(100), 2);
  assert.equal(calculateGear(160), 3);
  assert.equal(calculateGear(220), 4);
  assert.equal(calculateGear(280), 5);
  assert.equal(calculateGear(330), 6);
  assert.equal(calculateGear(365), 6);
});

test('calculateRpm returns appropriate idle and high rev range for MotoGP V4', () => {
  const idle = calculateRpm(0);
  assert.equal(idle.rpm, 4500);
  assert.equal(idle.rpmPercent, 0.1);

  const topGear = calculateRpm(360, 360);
  assert.equal(topGear.rpm, 18000);
  assert.equal(topGear.rpmPercent, 1.0);

  const midSpeed = calculateRpm(200, 360);
  assert.ok(midSpeed.rpm >= 10500 && midSpeed.rpm <= 18000);
});

test('calculateLeanAngleDeg accurately maps steering to realistic MotoGP lean angles', () => {
  assert.equal(calculateLeanAngleDeg(0), 0);
  // Full left turn
  const leftLean = calculateLeanAngleDeg(0.45);
  assert.ok(leftLean >= 50 && leftLean <= 60);
  // Full right turn
  const rightLean = calculateLeanAngleDeg(-0.45);
  assert.ok(rightLean <= -50 && rightLean >= -60);
});

test('calculateAnswerScore assigns proper points in solo and battle mode', () => {
  assert.equal(calculateAnswerScore(true, true), 150);
  assert.equal(calculateAnswerScore(true, false), 100);
  assert.equal(calculateAnswerScore(false, true), 0);
  assert.equal(calculateAnswerScore(false, false), 0);
});

test('calculateAccuracy calculates percentage accurately', () => {
  assert.equal(calculateAccuracy(4, 5), 80);
  assert.equal(calculateAccuracy(0, 0), 100);
  assert.equal(calculateAccuracy(3, 3), 100);
});

test('randomizeQuestion preserves question text and correct answer while shuffling', () => {
  const original = {
    id: 'q-1',
    text: 'Sirkuit MotoGP di Indonesia terletak di mana?',
    correctAnswer: 'Mandalika Lombok',
    options: ['Mandalika Lombok', 'Sentul', 'Sepang', 'Motegi'],
  };
  const randomized = randomizeQuestion(original);
  assert.equal(randomized.id, original.id);
  assert.equal(randomized.text, original.text);
  assert.equal(randomized.correctAnswer, original.correctAnswer);
  assert.equal(randomized.options.length, 4);
  assert.ok(randomized.options.includes('Mandalika Lombok'));
});

test('calculateGripFactor returns appropriate grip coefficient for dynamic weather', () => {
  assert.equal(calculateGripFactor('cerah'), 1.0);
  assert.equal(calculateGripFactor('mendung'), 0.95);
  assert.equal(calculateGripFactor('kabut'), 0.90);
  assert.equal(calculateGripFactor('hujan'), 0.78);
});

test('shouldEmitKneeSparks triggers only at high lean angle and racing speed', () => {
  assert.equal(shouldEmitKneeSparks(0, 150), false);
  assert.equal(shouldEmitKneeSparks(30, 180), false);
  assert.equal(shouldEmitKneeSparks(42, 70), true);
  assert.equal(shouldEmitKneeSparks(-55, 120), true);
  assert.equal(shouldEmitKneeSparks(50, 40), false); // too slow
});

test('shouldEmitTireSmoke triggers during hard braking or launch acceleration', () => {
  assert.equal(shouldEmitTireSmoke(30, true, false), true); // launch
  assert.equal(shouldEmitTireSmoke(150, true, false), false); // cruising
  assert.equal(shouldEmitTireSmoke(120, false, true), true); // hard braking
  assert.equal(shouldEmitTireSmoke(40, false, true), false); // gentle stop
});

test('getEffectiveTopSpeed accounts for rain aero-drag', () => {
  assert.equal(getEffectiveTopSpeed(360, 'cerah'), 360);
  assert.equal(getEffectiveTopSpeed(360, 'hujan'), 338);
  assert.equal(getEffectiveTopSpeed(360, 'kabut'), 349);
});

