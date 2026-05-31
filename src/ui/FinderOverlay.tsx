import { motion, AnimatePresence } from 'framer-motion'
import type { Category, RoomSize } from '../data/cisco'
import { FINDER_QUESTIONS } from '../scenes/FinderScene'

export interface FinderState {
  step: 0 | 1 | 2
  roomSize?: RoomSize
  category?: Category
}

interface Props {
  state: FinderState
  setState: (s: FinderState) => void
}

export function FinderOverlay({ state, setState }: Props) {
  if (state.step >= 2) {
    return (
      <div className="tree" aria-hidden={false}>
        <motion.div
          className="tree-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 520,
            pointerEvents: 'auto',
          }}
        >
          <h3>Your match</h3>
          <h2 style={{ marginBottom: 8 }}>
            {state.roomSize ? formatSize(state.roomSize) : 'Any space'}
            {state.category ? ` · ${formatCategory(state.category)}` : ''}
          </h2>
          <p style={{ color: 'var(--fg-2)', marginTop: 0 }}>
            Click any highlighted device in the 3D scene to see full specs, or
            tweak your answers below.
          </p>
          <div className="tree-actions">
            <button onClick={() => setState({ step: 0 })}>← Start over</button>
            <button onClick={() => setState({ ...state, step: 1 })}>
              ← Edit category
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const q = FINDER_QUESTIONS[state.step as 0 | 1]
  if (!q) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.step}
        className="tree"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
      >
        <div className="tree-card">
          <h3>Step {state.step + 1} of 2</h3>
          <h2>{q.title}</h2>
          <div className="choices">
            {q.options.map((opt) => (
              <button
                key={String(opt.label)}
                className="choice"
                onClick={() => {
                  if (state.step === 0) {
                    setState({
                      step: 1,
                      roomSize: opt.value as RoomSize,
                    })
                  } else {
                    setState({
                      step: 2,
                      roomSize: state.roomSize,
                      category: opt.value as Category | undefined,
                    })
                  }
                }}
              >
                <div className="label">{opt.label}</div>
                <div className="hint">{opt.hint}</div>
              </button>
            ))}
          </div>
          {state.step > 0 && (
            <div className="tree-actions">
              <button onClick={() => setState({ step: 0 })}>← Back</button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function formatSize(s: RoomSize) {
  return {
    personal: 'Personal / desk',
    mobile: 'On the go',
    huddle: 'Huddle',
    small: 'Small room',
    medium: 'Medium room',
    large: 'Large room',
    auditorium: 'Auditorium',
  }[s]
}
function formatCategory(c: Category) {
  return {
    room: 'Room device',
    desk: 'Desk device',
    phone: 'Phone',
    headset: 'Headset',
    peripheral: 'Peripheral',
    camera: 'Camera',
  }[c]
}
