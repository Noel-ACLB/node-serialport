import sinon from 'sinon'
import { CCTalkParser } from './'
import { assert } from '../../../test/assert'

describe('CCTalkParser', () => {
  it('constructs', () => {
    new CCTalkParser()
  })

  it('emits data for a default length message', () => {
    const data = Buffer.from([2, 0, 1, 254, 217])
    const spy = sinon.spy()
    const parser = new CCTalkParser()
    parser.on('data', spy)
    parser.write(data)
    assert.equal(spy.callCount, 1)
    assert.deepEqual(spy.getCall(0).args[0], Buffer.from([2, 0, 1, 254, 217]))
  })

  it('emits data for a 7 byte length message', () => {
    const parser = new CCTalkParser()
    const spy = sinon.spy()
    parser.on('data', spy)
    parser.write(Buffer.from([2, 2, 1, 254, 1, 1, 217]))
    assert.equal(spy.callCount, 1)
    assert.deepEqual(spy.getCall(0).args[0], Buffer.from([2, 2, 1, 254, 1, 1, 217]))
  })

  it('parses multiple length messages', () => {
    const parser = new CCTalkParser()
    const spy = sinon.spy()
    parser.on('data', spy)
    parser.write(Buffer.from([2, 2, 1]))
    parser.write(Buffer.from([254, 1, 1]))
    parser.write(Buffer.from([217, 2]))
    parser.write(Buffer.from([0, 1, 254, 217]))
    assert.equal(spy.callCount, 2)
    assert.deepEqual(spy.getCall(0).args[0], Buffer.from([2, 2, 1, 254, 1, 1, 217]))
    assert.deepEqual(spy.getCall(1).args[0], Buffer.from([2, 0, 1, 254, 217]))
  })

  it('parses a long message', () => {
    const parser = new CCTalkParser()
    const spy = sinon.spy()
    parser.on('data', spy)
    parser.write(Buffer.from([2, 2, 1, 254, 1, 1, 217, 2, 0, 1, 254, 217, 2, 2, 1, 251, 1, 1, 217, 2, 2, 1, 252, 1, 1, 217, 2, 0, 1, 253, 217]))
    assert.equal(spy.callCount, 5)
    assert.deepEqual(spy.getCall(0).args[0], Buffer.from([2, 2, 1, 254, 1, 1, 217]))
    assert.deepEqual(spy.getCall(1).args[0], Buffer.from([2, 0, 1, 254, 217]))
    assert.deepEqual(spy.getCall(2).args[0], Buffer.from([2, 2, 1, 251, 1, 1, 217]))
    assert.deepEqual(spy.getCall(3).args[0], Buffer.from([2, 2, 1, 252, 1, 1, 217]))
    assert.deepEqual(spy.getCall(4).args[0], Buffer.from([2, 0, 1, 253, 217]))
  })

  it('resets incomplete message after timeout', () => {
    const spy = sinon.spy()
    const clock = sinon.useFakeTimers(Date.now())
    const parser = new CCTalkParser(50)
    parser.on('data', spy)
    parser.write(Buffer.from([2, 2, 1]))
    clock.tick(51)
    parser.write(Buffer.from([2, 2, 1, 254, 1, 1, 217]))
    assert.equal(spy.callCount, 1)
    assert.deepEqual(spy.getCall(0).args[0], Buffer.from([2, 2, 1, 254, 1, 1, 217]))
    clock.restore()
  })

  it('disabled message timeout', () => {
    const spy = sinon.spy()
    const clock = sinon.useFakeTimers(Date.now())
    const parser = new CCTalkParser(0)
    parser.on('data', spy)
    parser.write(Buffer.from([2, 2, 1]))
    clock.tick(100)
    parser.write(Buffer.from([254, 1, 1, 217]))
    assert.equal(spy.callCount, 1)
    assert.deepEqual(spy.getCall(0).args[0], Buffer.from([2, 2, 1, 254, 1, 1, 217]))
    clock.restore()
  })
})
