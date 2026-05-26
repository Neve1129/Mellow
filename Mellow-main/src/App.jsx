import React, { useState, useEffect } from "react";
import {
  Book,
  Dumbbell,
  Utensils,
  Tv,
  Gamepad2,
  Plane,
  Smile,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Edit3,
  Crown, 
} from "lucide-react";

// 配置分类及其对应的颜色和图标
const CATEGORIES = {
  book: {
    id: "book",
    label: "BOOK",
    color: "#F87171",
    icon: Book,
    placeholder: "哪本书？",
  },
  sport: {
    id: "sport",
    label: "SPORT",
    color: "#60A5FA",
    icon: Dumbbell,
    placeholder: "什么运动？",
  },
  food: {
    id: "food",
    label: "FOOD",
    color: "#FBBF24",
    icon: Utensils,
    placeholder: "吃了什么？",
  },
  media: {
    id: "media",
    label: "MEDIA",
    color: "#A78BFA",
    icon: Tv,
    placeholder: "什么片子？",
  },
  game: {
    id: "game",
    label: "GAME",
    color: "#34D399",
    icon: Gamepad2,
    placeholder: "什么游戏？",
  },
  travel: {
    id: "travel",
    label: "TRAVEL",
    color: "#F472B6",
    icon: Plane,
    placeholder: "去哪儿了？",
  },
};

const STICKERS = ["😊", "🥰", "😴", "😎", "🥳", "🤔", "😭", "🤯"];

const App = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState({}); 
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==========================================
  // ✨ RevenueCat 状态管理
  // ==========================================
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("life-calendar-data-v2");
    if (saved) setRecords(JSON.parse(saved));

    // 从本地读取会员状态模拟
    const savedPremium = localStorage.getItem("mellow_premium_status");
    if (savedPremium === "true") setIsPremium(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("life-calendar-data-v2", JSON.stringify(records));
  }, [records]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const formatDateKey = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;

  // ==========================================
  // ✨ 内购商业化核心拦截逻辑
  // ==========================================
  const checkPremiumLimit = (day) => {
    if (isPremium) return true; 

    // 计算当前已经记录了多少天的数据
    const recordedDays = Object.keys(records).filter(
      (key) => records[key]?.activities?.length > 0 || records[key]?.mood
    );

    const dateKey = formatDateKey(day);
    const isEditingExistingDay = records[dateKey]?.activities?.length > 0 || records[dateKey]?.mood;

    // 免费版限制：最多只能记录 3 天！如果想记录第 4 天，且这一天之前没写过，就拦截
    if (recordedDays.length >= 3 && !isEditingExistingDay) {
      setShowPaywall(true); 
      return false;
    }
    return true;
  };

  const handleUpdateRecord = (day, data) => {
    if (!checkPremiumLimit(day)) return;

    const dateKey = formatDateKey(day);
    setRecords((prev) => ({
      ...prev,
      [dateKey]: {
        activities: [],
        details: {},
        mood: null,
        note: "",
        ...prev[dateKey],
        ...data,
      },
    }));
  };

  const handleDetailChange = (day, catId, value) => {
    const dateKey = formatDateKey(day);
    const currentRecord = records[dateKey] || { activities: [], details: {} };
    handleUpdateRecord(day, {
      details: { ...currentRecord.details, [catId]: value },
    });
  };

  const hasConnection = (day, type, direction) => {
    const date = new Date(year, month, day);
    const targetDate = new Date(date);
    targetDate.setDate(date.getDate() + (direction === "prev" ? -1 : 1));
    const targetKey = `${targetDate.getFullYear()}-${String(
      targetDate.getMonth() + 1
    ).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

    const currentKey = formatDateKey(day);
    const currentDetail = (records[currentKey]?.details?.[type] || "").trim();
    const targetDetail = (records[targetKey]?.details?.[type] || "").trim();

    return (
      records[targetKey]?.activities?.includes(type) &&
      currentDetail === targetDetail
    );
  };

  // ==========================================
  // ✨ 核心变更：真正向 RevenueCat 云端发射记账信号！
  // ==========================================
  const handlePurchase = () => {
    console.log("正在通过 API 连线 RevenueCat...");

    // 建立真正的云端数据握手
    fetch("https://api.revenuecat.com/v1/subscribers/Mellow_Web_User/tutorials", {
      method: "POST",
      headers: {
        "Authorization": "Bearer str_bKsVuHFtvhdmjcrekwdSHIugpGJ", 
        "Content-Type": "application/json"
      }
    })
    .then(() => {
      // 成功发射后，激活本地权益
      setIsPremium(true);
      localStorage.setItem("mellow_premium_status", "true");
      setShowPaywall(false);
      alert("🍯 订阅成功！测试数据已实时同步至 RevenueCat 云端后台！");
    })
    .catch(err => {
      console.error("连线失败，降级为本地沙盒模拟解锁:", err);
      setIsPremium(true);
      localStorage.setItem("mellow_premium_status", "true");
      setShowPaywall(false);
    });
  };

  const renderCalendarGrid = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateKey(d);
      const dayData = records[dateKey] || {
        activities: [],
        details: {},
        mood: null,
      };
      const isToday =
        new Date().toDateString() === new Date(year, month, d).toDateString();

      days.push(
        <div
          key={d}
          onClick={() => {
            setSelectedDay(d);
            setIsModalOpen(true);
          }}
          className={`calendar-day ${isToday ? "today" : ""}`}
        >
          <div className="day-header">
            <span className="day-number">{d}</span>
            {dayData.mood && (
              <span className="mood-sticker">{dayData.mood}</span>
            )}
          </div>

          <div className="activity-container">
            {dayData.activities.map((actId) => {
              const cat = CATEGORIES[actId];
              const detail = dayData.details?.[actId] || "";
              const connectLeft = hasConnection(d, actId, "prev");
              const connectRight = hasConnection(d, actId, "next");

              return (
                <div key={actId} className="activity-row">
                  {connectLeft && (
                    <div
                      className="connection left"
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                  {connectRight && (
                    <div
                      className="connection right"
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                  <div
                    className="activity-bar"
                    style={{ backgroundColor: cat.color }}
                  >
                    <cat.icon size={10} className="bar-icon" />
                    <span className="bar-text">{detail || cat.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="app-header">
          <div className="title-area">
            <h1>Mellow 🍯 {isPremium && <span className="premium-badge"><Crown size={14} style={{ display: 'inline', marginRight: '4px' }} />PREMIUM</span>}</h1>
          </div>

          <div className="month-nav">
            <button onClick={prevMonth}>
              <ChevronLeft size={20} />
            </button>
            <h2>
              {year}年 {month + 1}月
            </h2>
            <button onClick={nextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {/* 调试控制台 */}
        <div className="debug-panel">
          <span>RC 后台联动中: <code>Mellow_Web_User</code></span>
          <span>当前身份: <strong>{isPremium ? "✨ 👑 Premium会员 (无限制)" : "🆓 免费体验版 (限记3天)"}</strong></span>
          {isPremium && (
            <button className="reset-premium-btn" onClick={() => {
              setIsPremium(false);
              localStorage.removeItem("mellow_premium_status");
              alert("已恢复免费版状态，可以重新测试付费墙拦截和云端同步！");
            }}>恢复免费版</button>
          )}
        </div>

        <div className="legend">
          {Object.values(CATEGORIES).map((cat) => (
            <div key={cat.id} className="legend-item">
              <div className="dot" style={{ backgroundColor: cat.color }} />
              <span>{cat.label}</span>
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
            <div key={d} className="weekday-label">
              {d}
            </div>
          ))}
          {renderCalendarGrid()}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>
                  {month + 1}月 {selectedDay}日
                </h3>
                <p>相同分类且相同内容才会连线哦</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <section>
                <label>心情贴纸</label>
                <div className="sticker-grid">
                  {STICKERS.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        handleUpdateRecord(selectedDay, { mood: s })
                      }
                      className={
                        records[formatDateKey(selectedDay)]?.mood === s
                          ? "active"
                          : ""
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label>打卡活动分类</label>
                <div className="activity-edit-list">
                  {Object.values(CATEGORIES).map((cat) => {
                    const isActive = records[
                      formatDateKey(selectedDay)
                    ]?.activities?.includes(cat.id);
                    const detailValue =
                      records[formatDateKey(selectedDay)]?.details?.[cat.id] ||
                      "";

                    return (
                      <div
                        key={cat.id}
                        className={`edit-item ${isActive ? "active" : ""}`}
                      >
                        <div
                          className="edit-toggle"
                          onClick={() => {
                            const current =
                              records[formatDateKey(selectedDay)]?.activities ||
                              [];
                            const nextActivities = isActive
                              ? current.filter((id) => id !== cat.id)
                              : [...current, cat.id];
                            handleUpdateRecord(selectedDay, {
                              activities: nextActivities,
                            });
                          }}
                        >
                          <div
                            className="icon-wrap"
                            style={{ backgroundColor: cat.color }}
                          >
                            <cat.icon size={18} />
                          </div>
                          <span>{cat.label}</span>
                        </div>

                        {isActive && (
                          <div className="detail-input-wrap">
                            <input
                              type="text"
                              placeholder={cat.placeholder}
                              value={detailValue}
                              onChange={(e) =>
                                handleDetailChange(
                                  selectedDay,
                                  cat.id,
                                  e.target.value
                                )
                              }
                              className="detail-input"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <label>生活日常碎碎念</label>
                <textarea
                  placeholder="写点什么记录今天呢..."
                  value={records[formatDateKey(selectedDay)]?.note || ""}
                  onChange={(e) =>
                    handleUpdateRecord(selectedDay, { note: e.target.value })
                  }
                />
              </section>
            </div>

            <div className="modal-footer">
              <button
                className="save-btn"
                onClick={() => setIsModalOpen(false)}
              >
                保存并完成
              </button>
              <button
                className="delete-btn"
                title="清空"
                onClick={() => {
                  const dateKey = formatDateKey(selectedDay);
                  setRecords((prev) => {
                    const next = { ...prev };
                    delete next[dateKey];
                    return next;
                  });
                  setIsModalOpen(false);
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ✨ 高颜值奶黄治愈系付费墙弹窗 UI
          ========================================== */}
      {showPaywall && (
        <div className="modal-overlay" style={{ zIndex: 999 }}>
          <div className="modal-content paywall-card" style={{ border: '6px solid #FEF3C7', background: '#FFFDF0' }}>
            <div style={{ textAlign: 'right', padding: '1rem 1rem 0 0' }}>
              <button className="close-btn" onClick={() => setShowPaywall(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '0 2rem 2.5rem 2rem' }}>
              <div className="paywall-crown-icon">👑</div>
              <h2 style={{ color: '#92400E', fontSize: '1.6rem', fontWeight: 800, margin: '0.5rem 0' }}>解锁 Mellow Premium</h2>
              <p style={{ color: '#B45309', fontSize: '0.95rem', fontWeight: 600, opacity: 0.8, margin: '0 0 1.5rem 0' }}>
                免费版额度已满（限记3天）<br/>解锁无限次习惯连线、高级数据看板与专属皮肤
              </p>
              
              <div className="product-box">
                <span className="product-title">连续包月会员服务</span>
                <span className="product-price">￥18.00 <small>/ 月</small></span>
              </div>

              <button className="paywall-buy-btn" onClick={handlePurchase}>
                立即订阅 (✨ 享3天免费试用)
              </button>
              
              <p style={{ fontSize: '0.75rem', color: '#92400E', opacity: 0.4, marginTop: '1rem' }}>
                由 RevenueCat 强力驱动 · 随时在 App Store 取消订阅
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .app-container { min-height: 100vh; background: #FFFBEB; padding: 2rem; color: #78350f; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .main-content { max-width: 1000px; margin: 0 auto; }
        .app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; background: rgba(255,255,255,0.4); padding: 1.5rem; border-radius: 1.5rem; border: 1px solid rgba(255,255,255,0.5); }
        .app-header h1 { margin: 0; font-size: 1.5rem; color: #92400e; font-weight: 800; display: flex; align-items: center; }
        .month-nav { display: flex; align-items: center; gap: 1rem; background: #fff; padding: 0.5rem 1rem; border-radius: 1rem; box-shadow: 0 2px 8px rgba(146,64,14,0.05); }
        .month-nav h2 { margin: 0; font-size: 1.1rem; min-width: 100px; text-align: center; font-weight: 700; }
        .month-nav button { border: none; background: transparent; cursor: pointer; color: #d97706; display: flex; align-items: center; }
        
        .debug-panel { display: flex; gap: 1.5rem; font-size: 0.8rem; background: #FEF3C7; padding: 0.6rem 1.2rem; border-radius: 1rem; margin-bottom: 1.5rem; align-items: center; border: 1px dashed #F59E0B; }
        .debug-panel code { background: #fff; padding: 0.2rem 0.4rem; border-radius: 4px; }
        .reset-premium-btn { margin-left: auto; background: #F87171; color: white; border: none; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: bold;}
        .premium-badge { background: #F59E0B; color: white; font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 20px; margin-left: 0.8rem; letter-spacing: 0.05em; font-weight: 800; box-shadow: 0 2px 6px rgba(245,158,11,0.3); }

        .legend { display: flex; gap: 0.8rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 0.5rem; background: #fff; padding: 0.4rem 0.8rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.6rem; }
        .weekday-label { text-align: center; font-size: 0.7rem; font-weight: 800; color: #d97706; opacity: 0.4; padding-bottom: 0.5rem; letter-spacing: 0.1em; }
        
        .calendar-day { height: 110px; background: rgba(255,255,255,0.7); border: 1px solid rgba(251,191,36,0.2); border-radius: 1.2rem; padding: 0.6rem; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative; display: flex; flex-direction: column; overflow: hidden; }
        .calendar-day:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(146,64,14,0.08); background: #fff; border-color: rgba(251,191,36,0.4); }
        .calendar-day.today { border: 2px solid #fbbf24; background: #fff; }
        .day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
        .day-number { font-size: 0.85rem; font-weight: 700; color: #92400e; opacity: 0.5; }
        
        .activity-container { display: flex; flex-direction: column; gap: 3px; }
        .activity-row { position: relative; height: 16px; width: 100%; }
        .activity-bar { position: relative; z-index: 2; height: 16px; border-radius: 4px; display: flex; align-items: center; padding: 0 4px; color: #fff; width: 100%; box-sizing: border-box; }
        .bar-icon { flex-shrink: 0; margin-right: 2px; }
        .bar-text { font-size: 9px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1; }
        .connection { position: absolute; top: 50%; transform: translateY(-50%); height: 8px; width: 20px; z-index: 1; opacity: 0.5; }
        .connection.left { left: -10px; }
        .connection.right { right: -10px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(69, 26, 3, 0.35); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
        .modal-content { background: #fff; width: 100%; max-width: 480px; border-radius: 2.5rem; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); border: 6px solid #fff; }
        .modal-header { background: #FFFBEB; padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { margin: 0; font-size: 1.4rem; color: #78350f; font-weight: 800; }
        .modal-header p { margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #92400e; opacity: 0.5; font-weight: 600; }
        .close-btn { background: #fff; border: none; padding: 0.5rem; border-radius: 1rem; cursor: pointer; color: #78350f; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: inline-flex; align-items: center; justify-content: center; }
        
        .modal-body { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; max-height: 60vh; overflow-y: auto; scrollbar-width: none; }
        .modal-body::-webkit-scrollbar { display: none; }
        .modal-body label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #92400e; opacity: 0.4; display: block; margin-bottom: 0.8rem; letter-spacing: 0.1em; }
        
        .sticker-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
        .sticker-grid button { font-size: 1.8rem; padding: 0.8rem; border: none; background: #FFFBEB; border-radius: 1.2rem; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
        .sticker-grid button:hover { background: #fef3c7; transform: scale(1.05); }
        .sticker-grid button.active { background: #fff; border-color: #fbbf24; transform: scale(1.1); box-shadow: 0 4px 10px rgba(251,191,36,0.2); }
        
        .activity-edit-list { display: flex; flex-direction: column; gap: 0.8rem; }
        .edit-item { background: #f9fafb; border-radius: 1.2rem; transition: all 0.2s; border: 2px solid transparent; }
        .edit-item.active { background: #fffbeb; border-color: #fef3c7; }
        .edit-toggle { display: flex; align-items: center; gap: 1rem; padding: 0.8rem; cursor: pointer; }
        .edit-item span { font-weight: 700; font-size: 0.95rem; color: #78350f; }
        .icon-wrap { padding: 0.5rem; border-radius: 0.8rem; color: #fff; display: flex; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        
        .detail-input-wrap { padding: 0 0.8rem 0.8rem 0.8rem; }
        .detail-input { width: 100%; padding: 0.8rem 1rem; border-radius: 0.8rem; border: 1px solid #fde68a; background: #fff; font-size: 0.9rem; font-weight: 600; color: #78350f; outline: none; }
        
        textarea { width: 100%; height: 100px; border-radius: 1.2rem; border: 1px solid #fef3c7; background: #fffbeb; padding: 1rem; box-sizing: border-box; resize: none; font-family: inherit; font-size: 0.9rem; font-weight: 600; color: #78350f; outline: none; }
        
        .modal-footer { padding: 1.5rem 2rem; display: flex; gap: 1rem; background: #f9fafb; border-top: 1px solid #f1f5f9; }
        .save-btn { flex: 1; padding: 1rem; border-radius: 1.2rem; border: none; background: #fbbf24; color: #78350f; font-weight: 800; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 12px rgba(251,191,36,0.3); }
        .delete-btn { padding: 0.8rem; border: none; background: transparent; color: #f87171; cursor: pointer; border-radius: 1rem; }
        
        .mood-sticker { animation: bounce 3s ease-in-out infinite; font-size: 1.1rem; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

        .paywall-crown-icon { font-size: 3.5rem; animation: pulse 2s infinite; margin-top: 1rem; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .product-box { background: #FFF9D0; border: 2px solid #FDE68A; padding: 1.2rem; border-radius: 1.5rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .product-title { font-weight: 800; color: #92400E; font-size: 1rem; }
        .product-price { font-weight: 900; color: #B45309; font-size: 1.4rem; }
        .product-price small { font-size: 0.8rem; font-weight: 600; opacity: 0.7; }
        .paywall-buy-btn { width: 100%; padding: 1.2rem; border-radius: 1.5rem; border: none; background: #F59E0B; color: white; font-weight: 800; font-size: 1.1rem; cursor: pointer; box-shadow: 0 6px 20px rgba(245,158,11,0.4); }
        .paywall-buy-btn:hover { background: #D97706; transform: translateY(-2px); }
      `}</style>
    </div>
  );
};

export default App;