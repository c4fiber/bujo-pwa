// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { EntryComposer } from './EntryComposer'

afterEach(cleanup)

describe('EntryComposer', () => {
  it('버튼 클릭 시 입력한 내용이 저장된다', () => {
    const onAdd = vi.fn()
    render(<EntryComposer onAdd={onAdd} />)

    const input = screen.getByPlaceholderText('내용 입력…')
    fireEvent.change(input, { target: { value: '우유 사기' } })
    fireEvent.click(screen.getByText('추가'))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith('우유 사기', 'task')
  })

  it('IME 조합(compositionEnd 미발생) 상태에서도 버튼 클릭 시 저장된다', () => {
    // 회귀 방지: 예전엔 버튼의 mousedown+preventDefault가 blur를 막아
    // compositionEnd가 발생하지 않고 저장이 차단되던 버그.
    const onAdd = vi.fn()
    render(<EntryComposer onAdd={onAdd} />)

    const input = screen.getByPlaceholderText('내용 입력…')
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '한글' } })
    // compositionEnd 없이 바로 버튼 클릭
    fireEvent.click(screen.getByText('추가'))

    expect(onAdd).toHaveBeenCalledWith('한글', 'task')
  })

  it('Enter 키로도 저장된다', () => {
    const onAdd = vi.fn()
    render(<EntryComposer onAdd={onAdd} />)

    const input = screen.getByPlaceholderText('내용 입력…')
    fireEvent.change(input, { target: { value: '운동하기' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onAdd).toHaveBeenCalledWith('운동하기', 'task')
  })

  it('IME 확정 Enter(isComposing=true)는 저장하지 않는다', () => {
    const onAdd = vi.fn()
    render(<EntryComposer onAdd={onAdd} />)

    const input = screen.getByPlaceholderText('내용 입력…')
    fireEvent.change(input, { target: { value: '메모' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('공백만 입력하면 저장하지 않는다', () => {
    const onAdd = vi.fn()
    render(<EntryComposer onAdd={onAdd} />)

    const input = screen.getByPlaceholderText('내용 입력…')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('선택한 bullet type이 함께 저장된다', () => {
    const onAdd = vi.fn()
    render(<EntryComposer onAdd={onAdd} />)

    fireEvent.click(screen.getByTitle('이벤트'))
    const input = screen.getByPlaceholderText('내용 입력…')
    fireEvent.change(input, { target: { value: '회의' } })
    fireEvent.click(screen.getByText('추가'))

    expect(onAdd).toHaveBeenCalledWith('회의', 'event')
  })
})
