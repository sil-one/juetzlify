import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';

const WelcomeBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBannerStatus();
  }, []);

  const checkBannerStatus = async () => {
    try {
      // Fetch current banner version from backend
      const response = await fetch(`${API_BASE_URL}/banner/version`);
      const data = await response.json();

      if (data.success) {
        const currentVersion = data.version;
        const acceptedVersion = localStorage.getItem('welcomeBannerAccepted');

        // Show banner if version has changed or never accepted
        if (!acceptedVersion || acceptedVersion !== currentVersion.toString()) {
          setIsVisible(true);
        }
      }
    } catch (err) {
      console.error('Error checking banner version:', err);
      // If backend fails, check if user has ever accepted
      if (!localStorage.getItem('welcomeBannerAccepted')) {
        setIsVisible(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      // Fetch current version again to store it
      const response = await fetch(`${API_BASE_URL}/banner/version`);
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('welcomeBannerAccepted', data.version.toString());
      } else {
        // Fallback to storing a timestamp if version fetch fails
        localStorage.setItem('welcomeBannerAccepted', '1');
      }
    } catch (err) {
      console.error('Error storing banner acceptance:', err);
      localStorage.setItem('welcomeBannerAccepted', '1');
    }

    setIsVisible(false);
  };

  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />

      {/* Banner */}
      <div className="fixed inset-x-0 bottom-0 z-[101] p-4 sm:p-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-sp-dark via-sp-gray to-sp-dark border border-sp-light-gray rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative top border */}
          <div className="h-1 bg-gradient-to-r from-sp-green via-sp-green to-transparent" />

          <div className="p-6 sm:p-8">
            {/* Content */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-sp-text mb-4 text-center flex items-center justify-center gap-3">
                <span>Wilkommä üf Jützlify</span>
                <img
                  src="/juetzlify_logo.png"
                  alt="Jützlify"
                  className="w-8 h-8 sm:w-10 sm:h-10 inline-block"
                />
              </h2>
              <p className="text-sp-text-secondary text-base sm:text-lg leading-relaxed text-center max-w-3xl mx-auto">
                Mit der Benutzig vo derä Sitä stimmet Sie zuä Jützlify üsschliässlich z benutzä wenn sie guäti Lüünä hend oder wend bercho.
                D Cookies wo mer ihnä underjublet deffet Sie bhaltä, d Brunzli sind diä Beschstä. Mer empfähled ä Internetverbindig wo mindestens so zuäverlässig
                laift we d Chatzämüsiger wo diräkt as Friäkonzärt gend.
                Chämed Sie immer wieder mal verbii, der Liäderbestand wird
                über d Fasnacht üsbüwt und äs git vilicht nu anderi Iberraschigä!
                D Benutzig vo derä Websitä under 0.5 Promille isch möglich, aber nid testet, das gaht üf Ihri eigeni Verantwortig.
                <span className="block mt-3 text-sp-green font-semibold">
                  Viel Spass und scheeni Fasnacht!
                </span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={handleAccept}
                className="px-8 py-3 bg-sp-light-gray hover:bg-sp-gray text-sp-text-secondary hover:text-sp-text rounded-full font-medium transition-all duration-200 hover:scale-105 min-w-[160px]"
              >
                Isch mer egal
              </button>
              <button
                onClick={handleAccept}
                className="px-8 py-3 bg-sp-green hover:bg-[#27ae60] text-sp-black rounded-full font-bold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-sp-green/50 min-w-[160px]"
              >
                Verstandä!
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeBanner;
