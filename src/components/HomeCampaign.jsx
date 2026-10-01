import { useEffect, useRef, useState } from 'react';
import { motion as Motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContextValue';

export default function HomeCampaign({ image, video, videoMobile, imagePosition = 'center', eyebrow, title, href, cta, hero = false }) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const videoMobileRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(sectionRef, { amount: 0.1 });
  const [paused, setPaused] = useState(false);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);
  const Heading = hero ? 'h1' : 'h2';
  const { t } = useLanguage();

  useEffect(() => {
    [videoRef, videoMobileRef].forEach((ref) => {
      if (!ref.current) return;
      if (paused || reducedMotion) {
        ref.current.pause();
      } else {
        ref.current.play().catch(() => {});
      }
    });
  }, [paused, reducedMotion]);

  return (
    <section ref={sectionRef} className={`home-campaign${hero ? ' home-campaign--hero' : ''}`}>
      {video ? (
        <>
          <video
            ref={videoRef}
            src={video}
            autoPlay
            loop
            muted
            playsInline
            className="home-campaign__video-bg home-campaign__video-bg--desktop"
          />
          {videoMobile && (
            <video
              ref={videoMobileRef}
              src={videoMobile}
              autoPlay
              loop
              muted
              playsInline
              className="home-campaign__video-bg home-campaign__video-bg--mobile"
            />
          )}
        </>
      ) : (
        <Motion.div className="home-campaign__media" style={{ y: reducedMotion ? 0 : y }}>
          <img
            src={image}
            alt=""
            loading={hero ? 'eager' : 'lazy'}
            fetchPriority={hero ? 'high' : 'auto'}
            style={{ objectPosition: imagePosition, animationPlayState: inView && !paused && !reducedMotion ? 'running' : 'paused' }}
          />
        </Motion.div>
      )}
      <div className="home-campaign__shade" />
      <Motion.div
        className="home-campaign__copy"
        initial={reducedMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p>{eyebrow}</p>
        <Heading>{title}</Heading>
        <Link className="home-campaign__cta" to={href}>{cta}</Link>
      </Motion.div>
      {!reducedMotion && (
        <button
          type="button"
          className="home-campaign__motion-toggle"
          onClick={() => setPaused(!paused)}
          aria-label={`${t(paused ? 'campaign.play' : 'campaign.pause')} ${t('campaign.animation', { title })}`}
          aria-pressed={paused}
        >
          {paused ? <Play size={21} strokeWidth={1.3} /> : <Pause size={21} strokeWidth={1.3} />}
        </button>
      )}
    </section>
  );
}
