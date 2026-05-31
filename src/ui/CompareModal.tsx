import { AnimatePresence, motion } from 'framer-motion'
import type { Device } from '../data/cisco'
import { CATEGORY_LABELS, ROOM_SIZE_LABELS } from '../data/cisco'

interface Props {
  items: Device[]
  open: boolean
  onClose: () => void
}

const ROWS: { key: string; label: string; get: (d: Device) => string }[] = [
  { key: 'cat', label: 'Category', get: (d) => CATEGORY_LABELS[d.category] },
  { key: 'form', label: 'Form factor', get: (d) => d.formFactor },
  { key: 'tag', label: 'Tagline', get: (d) => d.tagline },
  { key: 'ppl', label: 'For', get: (d) => d.recommendedPeople ?? '—' },
  {
    key: 'rooms',
    label: 'Rooms',
    get: (d) => d.roomSizes.map((r) => ROOM_SIZE_LABELS[r]).join(', '),
  },
  { key: 'display', label: 'Display', get: (d) => d.display ?? '—' },
  { key: 'camera', label: 'Camera', get: (d) => d.camera ?? '—' },
  { key: 'audio', label: 'Audio', get: (d) => d.audio ?? '—' },
  {
    key: 'conn',
    label: 'Connectivity',
    get: (d) => d.connectivity?.join(', ') ?? '—',
  },
  {
    key: 'sw',
    label: 'Software',
    get: (d) => d.software?.join(', ') ?? '—',
  },
  {
    key: 'colors',
    label: 'Colors',
    get: (d) =>
      d.colors
        .map((c) => (c === 'carbon' ? 'Carbon Black' : 'First Light'))
        .join(', '),
  },
  {
    key: 'price',
    label: 'Price (USD CSRP)',
    get: (d) => (d.price ? `$${d.price.toLocaleString()}` : '—'),
  },
]

export function CompareModal({ items, open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.6)', zIndex: 30 }}
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            role="dialog"
            aria-label="Compare devices"
            style={{
              position: 'absolute',
              inset: '5% 5%',
              zIndex: 31,
              background: 'rgba(8,12,22,0.96)',
              border: '1px solid var(--line-strong)',
              borderRadius: 18,
              padding: '1.25rem',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h2 style={{ margin: 0 }}>Compare</h2>
              <button onClick={onClose}>✕</button>
            </div>
            <div style={{ overflow: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.88rem',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.6rem',
                        color: 'var(--fg-3)',
                        borderBottom: '1px solid var(--line)',
                      }}
                    />
                    {items.map((d) => (
                      <th
                        key={d.id}
                        style={{
                          textAlign: 'left',
                          padding: '0.6rem',
                          color: 'var(--cisco-primary)',
                          borderBottom: '1px solid var(--line)',
                          minWidth: 220,
                        }}
                      >
                        {d.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.key}>
                      <th
                        scope="row"
                        style={{
                          textAlign: 'left',
                          padding: '0.5rem 0.6rem',
                          color: 'var(--fg-3)',
                          verticalAlign: 'top',
                          borderBottom: '1px solid var(--line)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.label}
                      </th>
                      {items.map((d) => (
                        <td
                          key={d.id}
                          style={{
                            padding: '0.5rem 0.6rem',
                            color: 'var(--fg-2)',
                            verticalAlign: 'top',
                            borderBottom: '1px solid var(--line)',
                          }}
                        >
                          {row.get(d)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
