import React, { useState, useRef, useEffect } from "react";
import { publicApi } from "../../../services/api";
import { SendOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import ListingCard from "../../listing/ListingCard";

const AIChat = () => {
  const reduxFavorites = useSelector((state) => state.bootstrap?.favorites || []);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");

  const words = [
    "Smart",
    "Quick",
    "Instant",
    "Find",
    "Easy",
    "Optimal",
    "Nearby",
    "Reliable",
    "AI-Powered",
    "Intelligent",
  ];
  const typingSpeed = 200;
  const erasingSpeed = 100;
  const delayBetweenWords = 1500;
  const btnRef = useRef(null);
  const [inputText, setInputText] = useState("");
  const [submittedText, setSubmittedText] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const inputRef = useRef(null);
  const [aiResult, setAiResult] = useState(null);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const currentWordText = words[currentWord];
    let timer;

    if (isTyping) {
      if (charIndex < currentWordText.length) {
        timer = setTimeout(() => {
          setDisplayText((prev) => prev + currentWordText[charIndex]);
          setCharIndex((prev) => prev + 1);
        }, typingSpeed);
      } else {
        timer = setTimeout(() => {
          setIsTyping(false);
        }, delayBetweenWords);
      }
    } else {
      if (charIndex > 0) {
        timer = setTimeout(() => {
          setDisplayText((prev) => prev.slice(0, -1));
          setCharIndex((prev) => prev - 1);
        }, erasingSpeed);
      } else {
        setCurrentWord((prev) => (prev + 1) % words.length);
        setIsTyping(true);
      }
    }
    return () => clearTimeout(timer);
  }, [
    charIndex,
    isTyping,
    currentWord,
    words,
    typingSpeed,
    erasingSpeed,
    delayBetweenWords,
  ]);

  const userLocation = { latitude: 10.7769, longitude: 106.7009 };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setSubmittedText(inputText);
    setErrorMessage(null);
    setResponseData(null);
    try {
      const data = await publicApi.searchAI(inputText, {
        latitude: 10.7769,
        longitude: 106.7009,
      });

      // ✅ Compare with Redux favorites and mark them
      const recommendationsWithFavorites = data.recommendations?.map((item) => ({
        ...item,
        isFavorite: reduxFavorites.some(
          (fav) => fav.listingId === (item.listingId || item.id)
        ),
      })) || [];

      setResponseData({ ...data, recommendations: recommendationsWithFavorites });
      setAiResult({ ...data, recommendations: recommendationsWithFavorites });
    } catch (error) {
      setErrorMessage(error.message || "Có lỗi xảy ra khi tìm kiếm AI");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFavoriteToggle = async (listingId, currentState) => {
    try {
      if (currentState) {
        await publicApi.removeFavorite(listingId);
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Đã bỏ yêu thích",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await publicApi.addFavorite(listingId);
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Đã thêm vào yêu thích",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      // Cập nhật UI ngay lập tức
      setAiResult((prev) => ({
        ...prev,
        recommendations: prev?.recommendations?.map((item) =>
          item.listingId === listingId || item.id === listingId
            ? { ...item, isFavorite: !currentState }
            : item
        ) || [],
      }));
    } catch (error) {
      console.error("Lỗi toggle favorite:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể thay đổi yêu thích",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className={`min-h-screen h-full w-full p-8 bg-[#e7e1c1]`}>
      {/* Header */}
      <div className="relative w-full h-60 border border-b-[#ececec]">
        <div
          className="absolute left-1/2 top-1/2 w-full flex flex-col items-center justify-center gap-5"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-black">
            Tìm Trọ Nhanh Với
          </h1>

          <div className="text-4xl font-bold font-serif md:text-5xl flex items-center flex-wrap gap-5 justify-center">
            <span className="mr-4 bg-gradient-to-r from-green-400 to-orange-600 text-transparent bg-clip-text">
              Findnest
            </span>
            <span className="mr-4 bg-gradient-to-r from-green-400 to-orange-600 text-transparent bg-clip-text">
              {displayText}
              <span className="animate-pulse">|</span>
            </span>
          </div>
          <p className="text-gray-500 mb-10">
            Tìm trọ nhanh chóng theo mọi tiêu chí: địa chỉ, khu vực, số phòng,
            máy lạnh, tủ lạnh, tiện nghi khác hoặc bất kỳ yêu cầu đặc biệt nào.
          </p>
        </div>
      </div>

      {/* input */}
      <div
        className={`
                w-full max-w-3xl mx-auto transition-all duration-900 ease-in-out
                ${
                  submittedText
                    ? "sticky top-5 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-2xl px-6 py-4 h-15 z-2 "
                    : "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-10 py-8 rounded-2xl shadow-md h-25 text-2xl"
                }`}
      >
        <input
          type="text"
          placeholder="Nhập yêu cầu tìm trọ của bạn..."
          className="h-full text-black bg-[#f4fdf3] font-bold w-full border border-gray-300 rounded-xl  
                 px-5 py-4 pr-28 
                 focus:outline-none focus:ring-2 focus:ring-[#beb56c] resize-none"
          ref={inputRef}
          rows={submittedText ? 1 : 4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSubmit}
          className="w-10 h-10 absolute top-1/2 right-4 transform -translate-y-1/2 
                 bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer
                 px-5 py-2 rounded-lg transition-colors
                 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
        >
          <SendOutlined />
        </button>
      </div>

      {/* ✅ Results Grid with Redux Favorites */}
      {aiResult && (
        <div className="mt-30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiResult?.recommendations?.map((item) => (
            <ListingCard
              key={item.listingId || item.id}
              listing={item}
              onFavorite={(id) => handleFavoriteToggle(id, item.isFavorite)}
              onClickDetail={() => {
                // Thêm logic điều hướng hoặc xem chi tiết nếu cần
              }}
              isFavorited={item.isFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AIChat;
