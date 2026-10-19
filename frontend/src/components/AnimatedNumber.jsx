import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

export default function AnimatedNumber({ value = 0, suffix = '', duration = 1 }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => `${Math.round(v)}${suffix}`)

  useEffect(() => {
    const controls = animate(motionValue, value, { duration, ease: 'easeOut' })
    return controls.stop
  }, [motionValue, value, duration])

  return <motion.span>{rounded}</motion.span>
}
