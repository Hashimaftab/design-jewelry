import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useLanguage } from '../context/LanguageContextValue';
import './ShippingAnnouncement.css';

export default function ShippingAnnouncement() {
  const { t } = useLanguage();
  const [paused, setPaused] = useState(false);
  const message = t('home.freeShipping');
  return (
    <aside className={`shipping-announcement${paused ? ' is-paused' : ''}`} aria-label={message}>
      <div className="shipping-announcement__viewport" aria-hidden="true">
        <div className="shipping-announcement__track">
          {[0, 1].map((group) => (
            <div className="shipping-announcement__group" key={group}>
              {[0, 1, 2, 3].map((copy) => <span key={copy}>{message}<i>✦</i></span>)}
            </div>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => setPaused((value) => !value)}
        aria-label={t(paused ? 'home.resumeAnnouncement' : 'home.pauseAnnouncement')} aria-pressed={paused}>
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </aside>
  );
}
