import { motion, AnimatePresence } from 'framer-motion'
import type { Category, Device } from '../data/cisco'
import { CATEGORY_LABELS, ROOM_SIZE_LABELS } from '../data/cisco'
import { deviceImage } from '../data/deviceImages'

const ROOMOS_DOCS_URL = 'https://roomos.cisco.com/doc/Welcome/Welcome'
const COMPONENTS_CABLES_URL =
  'https://salesresources.cisco.com/Link/Content/DCQGRm7J4VTXP8mHbHhBm3Pqm2qV'

const COMPONENTS_CABLES_CATEGORIES = new Set<Category>([
  'room',
  'desk',
  'peripheral',
  'camera',
])

function hasRoomOsSoftware(device: Device): boolean {
  return device.software?.some((entry) => /roomos/i.test(entry)) ?? false
}

interface Props {
  device: Device | null
  onClose: () => void
  inCompare: boolean
  canAddCompare: boolean
  onToggleCompare: (d: Device) => void
}

export function DeviceDrawer({
  device,
  onClose,
  inCompare,
  canAddCompare,
  onToggleCompare,
}: Props) {
  return (
    <AnimatePresence>
      {device && (
        <>
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="drawer"
            key={device.id}
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            role="dialog"
            aria-label={`${device.name} details`}
          >
            <header className="drawer-header">
              <div>
                <div className="tag">{CATEGORY_LABELS[device.category]}</div>
                <h2>{device.name}</h2>
              </div>
              <button onClick={onClose} aria-label="Close details">
                ✕
              </button>
            </header>
            <p className="tagline">{device.tagline}</p>

            {deviceImage(device.id) && (
              <div className="drawer-photo">
                <img src={deviceImage(device.id)} alt={device.name} />
              </div>
            )}

            {device.price !== undefined && (
              <span className="price-pill">
                From ${device.price.toLocaleString()}{' '}
                <span style={{ opacity: 0.7 }}>{device.priceNote}</span>
              </span>
            )}

            <h4>Form factor</h4>
            <p className="spec">{device.formFactor}</p>

            {device.recommendedPeople && (
              <>
                <h4>Recommended for</h4>
                <p className="spec">{device.recommendedPeople} people</p>
              </>
            )}

            <h4>Room sizes</h4>
            <p className="spec">
              {device.roomSizes
                .map((r) => ROOM_SIZE_LABELS[r])
                .join(' · ')}
            </p>

            {device.highlights?.length > 0 && (
              <>
                <h4>Key features</h4>
                <ul>
                  {device.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </>
            )}

            {device.display && (
              <>
                <h4>Display</h4>
                <p className="spec">{device.display}</p>
              </>
            )}
            {device.camera && (
              <>
                <h4>Camera</h4>
                <p className="spec">{device.camera}</p>
              </>
            )}
            {device.audio && (
              <>
                <h4>Audio</h4>
                <p className="spec">{device.audio}</p>
              </>
            )}
            {device.connectivity && device.connectivity.length > 0 && (
              <>
                <h4>Connectivity</h4>
                <p className="spec">{device.connectivity.join(' · ')}</p>
              </>
            )}
            {device.software && device.software.length > 0 && (
              <>
                <h4>Software</h4>
                <p className="spec">{device.software.join(' · ')}</p>
              </>
            )}

            <h4>Colors</h4>
            <p className="spec">
              {device.colors
                .map((c) =>
                  c === 'carbon' ? 'Carbon Black' : 'First Light',
                )
                .join(' · ')}
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => onToggleCompare(device)}
                data-active={inCompare ? 'true' : 'false'}
                disabled={!inCompare && !canAddCompare}
                title={
                  !inCompare && !canAddCompare
                    ? 'Compare tray full — remove one to add'
                    : ''
                }
              >
                {inCompare ? '✓ In compare' : '＋ Add to compare'}
              </button>
              <button onClick={onClose}>Close</button>
            </div>

            {(device.category === 'room' || device.category === 'desk') && (
              <a
                href="https://designer.webex.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="drawer-external-link"
                aria-label="Configure this in Cisco Workspace Designer (opens in a new tab)"
              >
                <span aria-hidden>⌗</span>
                <span>Configure this in Cisco Workspace Designer ↗</span>
              </a>
            )}

            {(hasRoomOsSoftware(device) ||
              COMPONENTS_CABLES_CATEGORIES.has(device.category)) && (
              <div className="drawer-resource-links">
                {hasRoomOsSoftware(device) && (
                  <a
                    href={ROOMOS_DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="drawer-external-link"
                    aria-label="Open Cisco RoomOS documentation (opens in a new tab)"
                  >
                    <span aria-hidden>⊞</span>
                    <span>Cisco RoomOS documentation ↗</span>
                  </a>
                )}
                {COMPONENTS_CABLES_CATEGORIES.has(device.category) && (
                  <a
                    href={COMPONENTS_CABLES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="drawer-external-link drawer-external-link--gated"
                    aria-label="Open Components and Cables for Collaboration Devices on Cisco Sales Resources (requires CCO login, opens in a new tab)"
                    title="Components and Cables for Collaboration Devices — requires Cisco Connection Online (CCO) login"
                  >
                    <span aria-hidden>⎔</span>
                    <span>
                      Components &amp; Cables for Collaboration Devices ↗
                      <span className="drawer-external-link-note">
                        Requires CCO login
                      </span>
                    </span>
                  </a>
                )}
              </div>
            )}

            <p
              style={{
                marginTop: 18,
                fontSize: 11,
                color: 'var(--fg-3)',
                lineHeight: 1.5,
              }}
            >
              Photos and specifications adapted from Cisco’s publicly
              published{' '}
              <a
                href="https://www.webex.com/content/dam/wbx/us/documents/pdf/Collaboration_Device_Product_Matrix_Brochure.pdf"
                target="_blank"
                rel="noreferrer noopener"
                style={{ color: 'var(--brand-1)' }}
              >
                Collaboration Device Product Matrix
              </a>
              . This site is unaffiliated with Cisco; photos remain the
              property of their respective owners.
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
