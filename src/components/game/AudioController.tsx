"use client";

interface AudioControllerProps {
  isMuted: boolean;
  onMuteToggle: () => void;
}

export default function AudioController({ isMuted, onMuteToggle }: AudioControllerProps) {
  console.log('CHILD: AudioController rendered with isMuted:', isMuted);
  
  return (
    <div 
      className="absolute top-16 left-4"
      style={{ zIndex: 50 }}
    >
      <button 
        onClick={(e) => {
          console.log('CHILD: MUTE BUTTON CLICKED');
          console.log('CHILD: Current mute state:', isMuted);
          console.log('CHILD: Button element:', e.currentTarget);
          console.log('CHILD: Button position:', e.currentTarget.getBoundingClientRect());
          e.stopPropagation(); // Prevent any parent handlers from catching this
          onMuteToggle();
        }}
        className={`p-2 rounded-full shadow-lg transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          height="24px" 
          viewBox="0 -960 960 960" 
          width="24px" 
          fill="#FFFFFF"
        >
          {isMuted ? (
            <path d="M792-56 56-792l56-56 736 736-56 56ZM560-514l-80-80v-246h240v160H560v166ZM400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-62l80 80v120q0 66-47 113t-113 47Z"/>
          ) : (
            <path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47Z"/>
          )}
        </svg>
      </button>
    </div>
  );
}
