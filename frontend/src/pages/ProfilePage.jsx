import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Calendar, ShieldCheck, Edit2 } from "lucide-react";
import gsap from "gsap";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [fullname, setFullname] = useState(authUser?.fullname || "");
  const [about, setAbout] = useState(authUser?.about || "");

  const containerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleProfileUpdate = async () => {
    await updateProfile({
      fullname,
      about,
      profilePic: selectedImg,
    });
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-2xl overflow-y-auto" ref={containerRef}>
      <div className="space-y-8 pb-10" ref={contentRef}>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-base-content/70">Manage your personal information</p>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="relative size-32 rounded-full overflow-hidden border-4 border-base-100 shadow-xl ring-4 ring-base-300/50 transition-all duration-300 group-hover:ring-primary/50">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Camera className="w-8 h-8 text-white/80" />
              </div>
            </div>

            <label
              htmlFor="avatar-upload"
              className={`
                absolute bottom-0 right-0 
                bg-primary hover:bg-primary-focus text-primary-content
                p-2.5 rounded-full cursor-pointer shadow-lg
                transition-all duration-200 hover:scale-110 hover:rotate-12
                ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
              `}
            >
              <Edit2 className="w-4 h-4" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUpdatingProfile}
              />
            </label>
          </div>
          <p className="text-sm text-base-content/60">
            {isUpdatingProfile ? "Uploading..." : "Click edit icon to update photo"}
          </p>
        </div>

        {/* Profile Form */}
        <div className="bg-base-100/50 backdrop-blur-lg border border-base-300 rounded-2xl p-6 shadow-sm space-y-6">

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2 text-base-content/80">
              <User className="w-4 h-4 text-primary" />
              Full Name
            </label>
            <input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="input input-bordered w-full bg-base-200/50 focus:bg-base-200 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
              placeholder="Enter your full name"
            />
          </div>

          {/* About */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2 text-base-content/80">
              <div className="w-4 h-4 flex items-center justify-center font-serif italic text-secondary font-bold">i</div>
              About
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="textarea textarea-bordered w-full bg-base-200/50 focus:bg-base-200 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl min-h-[100px] resize-none"
              placeholder="Tell everyone about yourself..."
            />
          </div>

          {/* Update Button */}
          <button
            onClick={handleProfileUpdate}
            disabled={isUpdatingProfile}
            className="btn btn-primary w-full rounded-xl shadow-lg hover:shadow-primary/20 transition-all"
          >
            {isUpdatingProfile ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-base-100/50 backdrop-blur-lg border border-base-300 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            Account Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-base-200/30 rounded-xl border border-base-content/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center text-base-content/60">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Member Since</span>
              </div>
              <span className="text-sm text-base-content/70 font-mono">
                {authUser.createdAt?.split("T")[0]}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-base-200/30 rounded-xl border border-base-content/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center text-base-content/60">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <span className="text-sm font-medium">Account Status</span>
              </div>
              <span className="text-sm text-green-500 font-medium bg-green-500/10 px-3 py-1 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-base-content/80 ml-1">
                <Mail className="w-4 h-4 text-base-content/50" />
                Email Address
              </label>
              <div className="px-4 py-3 bg-base-200/50 rounded-xl border border-base-300 text-base-content/70 text-sm font-mono truncate">
                {authUser?.email}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
