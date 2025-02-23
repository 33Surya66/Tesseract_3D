import { useState, useRef, useEffect } from "react";
import { Play, Pause, FastForward, Rewind } from "lucide-react";

const AnimationTimeline = ({
  currentFrame,
  setCurrentFrame,
  initialDuration = 100,
  keyframes,
  onTimeUpdate,
  animationStates,
  setAnimationStates,
  selectedObject
}) => {
  const [duration, setDuration] = useState(initialDuration);
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef(null);
  const animationRef = useRef(null);
  const previousTimeRef = useRef(0);

  const availableAnimations = [
    "rotating",
    "floating",
    "pulsing",
    "scaling",
    "bouncing",
    "hovering"
  ];

  const calculateIntervals = () => {
    let step;
    if (duration <= 100) step = 10;
    else if (duration <= 200) step = 20;
    else if (duration <= 500) step = 50;
    else step = 100;

    const intervals = [];
    for (let i = 0; i <= duration; i += step) {
      intervals.push(i);
    }
    if (intervals[intervals.length - 1] !== duration) {
      intervals.push(duration);
    }
    return intervals;
  };

  useEffect(() => {
    const updateAnimation = (timestamp) => {
      if (!previousTimeRef.current) previousTimeRef.current = timestamp;
      const deltaTime = timestamp - previousTimeRef.current;

      if (deltaTime >= 16.67) {
        setCurrentFrame((prev) => {
          const nextFrame = prev + 1;
          if (nextFrame >= duration) {
            setIsPlaying(false);
            return duration;
          }
          onTimeUpdate?.(nextFrame);
          return nextFrame;
        });
        previousTimeRef.current = timestamp;
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateAnimation);
      }
    };

    if (isPlaying) {
      previousTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(updateAnimation);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, duration, onTimeUpdate]);

  const togglePlayPause = () => {
    if (currentFrame >= duration) {
      setCurrentFrame(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const frame = Math.round(percentage * duration);
    setCurrentFrame(Math.min(Math.max(frame, 0), duration));
    onTimeUpdate?.(frame);
  };

  const handleKeyframe = (frame) => {
    setCurrentFrame(frame);
    onTimeUpdate?.(frame);
  };

  const handleDurationChange = (e) => {
    const newDuration = Math.max(1, parseInt(e.target.value) || 0);
    setDuration(newDuration);
    if (currentFrame > newDuration) {
      setCurrentFrame(newDuration);
      onTimeUpdate?.(newDuration);
    }
  };

  const toggleAnimation = (anim) => {
    if (!selectedObject?.id) return;
    
    setAnimationStates(prev => ({
      ...prev,
      [selectedObject.id]: {
        ...prev[selectedObject.id],
        [anim.toLowerCase()]: !prev[selectedObject.id]?.[anim.toLowerCase()]
      }
    }));
  };

  const deleteAnimation = (anim) => {
    if (!selectedObject?.id) return;
    
    setAnimationStates(prev => {
      const newState = { ...prev };
      if (newState[selectedObject.id]) {
        delete newState[selectedObject.id][anim];
      }
      return newState;
    });
  };

  const getAppliedAnimations = () => {
    if (!selectedObject?.id || !animationStates[selectedObject.id]) return [];
    return Object.entries(animationStates[selectedObject.id])
      .filter(([_, active]) => active)
      .map(([type]) => type);
  };

  const intervals = calculateIntervals();
  const appliedAnimations = getAppliedAnimations();

  return (
    <div className="bg-gray-900 p-4 space-y-6">
      {/* Timeline Controls */}
      <div className="space-y-2">
        <div className="relative h-6">
          {intervals.map((frame) => (
            <div
              key={frame}
              className="absolute text-xs text-gray-400"
              style={{
                left: `${(frame / duration) * 100}%`,
                transform: "translateX(-50%)"
              }}
            >
              {frame}
            </div>
          ))}
        </div>

        <div
          ref={timelineRef}
          className="relative h-8 bg-gray-700 rounded-lg cursor-pointer"
          onClick={handleTimelineClick}
        >
          {intervals.map((frame) => (
            <div
              key={frame}
              className="absolute top-0 w-px h-2 bg-gray-500"
              style={{ left: `${(frame / duration) * 100}%` }}
            />
          ))}

          {keyframes && Object.keys(keyframes).map((frame) => (
            <div
              key={frame}
              className="absolute top-0 w-1 h-full bg-yellow-500 cursor-pointer hover:bg-blue-400 transition-colors"
              style={{
                left: `${(parseInt(frame) / duration) * 100}%`,
                zIndex: 10
              }}
              onClick={() => handleKeyframe(parseInt(frame))}
            />
          ))}

          <div
            className="absolute top-0 left-0 h-full bg-blue-600 rounded-l-lg"
            style={{ width: `${(currentFrame / duration) * 100}%` }}
          />

          <div
            className="absolute top-0 w-2 h-full bg-white"
            style={{ left: `${(currentFrame / duration) * 100}%` }}
          />
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentFrame(0)}
            className="p-2 text-white hover:text-blue-400 transition-colors"
          >
            <Rewind size={20} />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-2 text-white hover:text-blue-400 transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={() => setCurrentFrame(duration)}
            className="p-2 text-white hover:text-blue-400 transition-colors"
          >
            <FastForward size={20} />
          </button>

          <div className="flex items-center space-x-2 text-white">
            <span>Frame: {currentFrame} /</span>
            <input
              type="number"
              value={duration}
              onChange={handleDurationChange}
              className="w-20 px-2 py-1 bg-gray-700 rounded border border-gray-600 text-white"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Animation Controls */}
      {selectedObject && (
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-bold mb-4 text-white">Animations</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {availableAnimations.map((anim) => (
              <button
                key={anim}
                className={`px-3 py-2 rounded text-sm text-white ${
                  appliedAnimations.includes(anim)
                    ? "bg-blue-700"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={() => toggleAnimation(anim)}
              >
                {anim.charAt(0).toUpperCase() + anim.slice(1)}
              </button>
            ))}
          </div>

          {appliedAnimations.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {appliedAnimations.map((anim) => (
                <button
                  key={anim}
                  className="bg-red-500 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-between"
                  onClick={() => deleteAnimation(anim)}
                >
                  <span>{anim.charAt(0).toUpperCase() + anim.slice(1)}</span>
                  <span>✖</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No animations applied.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AnimationTimeline;