"use client";

interface AudioControllerProps {
  isMuted: boolean;
  onMuteToggle: (muted: boolean) => void;
}

const VolumeOnIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="24px" 
    viewBox="0 -960 960 960" 
    width="24px" 
    fill="#FFFFFF"
  >
    <path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47Z"/>
  </svg>
);

const VolumeOffIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="24px" 
    viewBox="0 -960 960 960" 
    width="24px" 
    fill="#FFFFFF"
  >
    <path d="M792-56 56-792l56-56 736 736-56 56ZM560-514l-80-80v-246h240v160H560v166ZM400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-62l80 80v120q0 66-47 113t-113 47Z"/>
  </svg>
);

export default function AudioController({ isMuted, onMuteToggle }: AudioControllerProps) {
  return (
    <div className="absolute top-16 left-4">
      <button 
        onClick={() => onMuteToggle(!isMuted)}
        className={`p-2 rounded-full shadow-lg transition-colors ${
          isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </button>
    </div>
  );
}
