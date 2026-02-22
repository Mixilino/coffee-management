import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

interface StopwatchProps {
  onTimeUpdate: (seconds: number) => void;
}

export default function Stopwatch({ onTimeUpdate }: StopwatchProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const secs = Math.floor((now - startTimeRef.current) / 1000);
        setElapsed(secs);
        onTimeUpdate(secs);
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const formatTime = useCallback((totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleStartStop = () => setRunning((prev) => !prev);

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    onTimeUpdate(0);
  };

  return (
    <View className="items-center gap-3">
      <Text className="text-5xl font-bold text-white font-mono tracking-wider">
        {formatTime(elapsed)}
      </Text>
      <View className="flex-row gap-3">
        <Pressable
          onPress={handleStartStop}
          className={`px-8 py-3 rounded-xl ${running ? 'bg-red-500' : 'bg-green-600'}`}
        >
          <Text className="text-white font-bold text-base">
            {running ? 'Stop' : 'Start'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleReset}
          className="px-8 py-3 rounded-xl bg-zinc-700"
        >
          <Text className="text-white font-bold text-base">Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}
