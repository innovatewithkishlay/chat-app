import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Calendar, ShieldCheck, Edit2 } from "lucide-react";
import SettingsLayout from "../components/SettingsLayout";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [fullname, setFullname] = useState(authUser?.fullname || "");
  const [about, setAbout] = useState(authUser?.about || "");

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
    <SettingsLayout>
      <div className="space-y-8 pb-10">
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-2">My Profile</h2>
          <p className="text-base-content/60">Manage your personal information</p>
        </div>

        {/* Center Content Wrapper */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative group">
            <div className="relative size-24 rounded-full overflow-hidden border-2 border-base-content/10 shadow-sm ring-2 ring-base-100 transition-all duration-300 group-hover:ring-primary/20">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white/80" />
              </div>
            </div>
            <label
              htmlFor="avatar-upload"
              className={`
                absolute bottom-0 right-0 
                bg-base-100 text-base-content border border-base-200
                w-7 h-7 flex items-center justify-center rounded-full cursor-pointer shadow-sm
                transition-all duration-200 hover:scale-110 hover:shadow-md
                ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
              `}
            >
              <Edit2 className="w-3.5 h-3.5" />
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
          <p className="text-xs text-base-content/50">
            {isUpdatingProfile ? "Uploading..." : "Click edit icon to update photo"}
          </p>
        </div>

        {/* Content Wrapper */}
        <div className="max-w-[720px] mx-auto space-y-6">

          {/* Profile Form */}
          <div className="bg-base-100 border border-base-300 rounded-xl p-5 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium flex items-center gap-2 text-base-content/70">
                  <User className="w-4 h-4 text-primary" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full px-4 py-2.5 bg-base-200 border border-base-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium flex items-center gap-2 text-base-content/70">
                  <div className="w-4 h-4 flex items-center justify-center font-serif italic text-base-content/60 font-bold">i</div>
                  About
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full px-4 py-2.5 bg-base-200 border border-base-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all min-h-[100px] resize-none text-sm"
                  placeholder="Tell everyone about yourself..."
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleProfileUpdate}
                disabled={isUpdatingProfile}
                className="w-full sm:w-auto h-10 px-6 bg-primary hover:bg-primary-focus text-white rounded-lg font-medium shadow-sm transition-all active:scale-[0.98] text-sm"
              >
                {isUpdatingProfile ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading loading-spinner loading-xs"></span>
                    Updating...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-base-100 border border-base-300 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-base-content">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Account Information
            </h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-3 border-b border-base-200 first:pt-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-base-content/70">Member Since</span>
                </div>
                <span className="text-sm text-base-content/60 font-mono">
                  {authUser.createdAt?.split("T")[0]}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-base-200">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-base-content/70">Account Status</span>
                </div>
                <span className="text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full text-xs">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between py-3 last:pb-0 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-base-content/70">Email Address</span>
                </div>
                <span className="text-sm text-base-content/60 font-mono">
                  {authUser?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default ProfilePage;

