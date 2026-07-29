import { profileAvatars } from "../data/mockData";

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
}

export function AvatarPicker({ selectedAvatar, onSelect, onClose }: AvatarPickerProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl p-6 w-[500px] max-w-[90vw]">
        <h3 className="text-foreground mb-4" style={{ fontSize: "16px", fontWeight: 600 }}>
          Escolha sua foto de perfil
        </h3>
        <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
          {profileAvatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => onSelect(avatar.id)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedAvatar === avatar.id
                  ? "border-[#6366f1] ring-2 ring-[#6366f1]/20"
                  : "border-border hover:border-[#6366f1]/50"
              }`}
            >
              <img
                src={avatar.imagePath}
                alt={avatar.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/avatars/default.png";
                }}
              />
              {selectedAvatar === avatar.id && (
                <div className="absolute inset-0 bg-[#6366f1]/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-[#6366f1] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
