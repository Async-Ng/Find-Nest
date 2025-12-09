import React from 'react';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';

const SearchBar = ({
    searchText,
    setSearchText,
    onSearch,
    placeholder = "Tìm kiếm phòng trọ theo tên, địa chỉ, tiện ích...",
    maxWidth = "700px"
}) => {

    const handleInputChange = (e) => {
        setSearchText(e.target.value);
    };

    const handleSearch = () => {
        onSearch();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClear = () => {
        setSearchText('');
        onSearch();
    };

    // ⭐ ENHANCED SEARCH BAR STYLES
    const styles = {
        container: {
            display: 'flex',
            alignItems: 'center',
            maxWidth: maxWidth,
            width: '100%',
            margin: '0 auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            height: '60px',
            position: 'relative'
        },
        inputContainer: {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '24px',
            gap: '12px'
        },
        searchIcon: {
            color: '#FF8C42', // ⭐ Orange
            fontSize: '20px',
            opacity: 0.8
        },
        input: {
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '16px',
            color: '#2d3748',
            fontFamily: 'inherit',
            fontWeight: '500',
            height: '100%',
            padding: '0'
        },
        clearButton: {
            background: 'rgba(113, 128, 150, 0.1)',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            color: '#718096',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            margin: '0 12px',
            opacity: 0.7
        },
        searchButton: {
            background: 'linear-gradient(135deg, #FF8C42 0%, #FFB366 100%)', // ⭐ Orange gradient
            border: 'none',
            padding: '0 32px',
            color: '#ffffff',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: '15px',
            whiteSpace: 'nowrap',
            height: '60px',
            borderRadius: '0 14px 14px 0',
            minWidth: '140px',
            letterSpacing: '0.5px'
        }
    };

    // ⭐ ENHANCED STYLES với better effects
    const enhancedStyles = `
        .search-container {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-container:hover {
            box-shadow: 0 12px 40px rgba(255, 140, 66, 0.15) !important; /* ⭐ Orange */
            transform: translateY(-3px) !important;
            border-color: rgba(255, 140, 66, 0.4) !important; /* ⭐ Orange */
        }

        .search-container:focus-within {
            box-shadow: 0 0 0 4px rgba(255, 140, 66, 0.2) !important; /* ⭐ Orange */
            border-color: rgba(255, 140, 66, 0.6) !important; /* ⭐ Orange */
            transform: translateY(-2px) !important;
        }

        /* ⭐ PLACEHOLDER STYLES - No italic */
        .search-input::placeholder {
            color: #9ca3af !important;
            font-style: normal !important;
            font-weight: 400 !important;
            opacity: 0.8 !important;
        }

        .search-input:focus::placeholder {
            opacity: 0.5 !important;
        }

        /* ⭐ BUTTON HOVER EFFECTS */
        .search-button {
            position: relative;
            overflow: hidden;
        }

        .search-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s ease;
        }

        .search-button:hover::before {
            left: 100%;
        }

        .search-button:hover {
            background: linear-gradient(135deg, #E67A2E 0%, #FF9F5A 100%) !important; /* ⭐ Darker orange gradient */
            transform: scale(1.02) !important;
            box-shadow: 0 6px 20px rgba(255, 140, 66, 0.4) !important; /* ⭐ Orange shadow */
        }

        .search-button:active {
            transform: scale(0.98) !important;
        }

        .search-button-icon {
            transition: transform 0.2s ease;
        }

        .search-button:hover .search-button-icon {
            transform: scale(1.1);
        }

        /* ⭐ CLEAR BUTTON EFFECTS */
        .clear-button {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .clear-button:hover {
            background: rgba(239, 68, 68, 0.1) !important;
            color: #ef4444 !important;
            transform: scale(1.1) !important;
            border-radius: 8px !important;
        }

        .clear-button:active {
            transform: scale(0.95) !important;
        }

        /* ⭐ MOBILE RESPONSIVE */
        @media (max-width: 768px) {
            .search-container {
                max-width: 95% !important;
                margin: 0 8px !important;
                height: 52px !important;
                border-radius: 14px !important;
            }
            
            .search-input {
                font-size: 15px !important;
            }
            
            .search-button {
                padding: 0 24px !important;
                font-size: 14px !important;
                height: 52px !important;
                min-width: 120px !important;
                border-radius: 0 12px 12px 0 !important;
            }
            
            .search-button-text {
                display: none !important;
            }

            .clear-button {
                width: 28px !important;
                height: 28px !important;
            }

            .search-icon {
                font-size: 18px !important;
            }

            .input-container {
                padding-left: 20px !important;
            }
        }

        @media (max-width: 480px) {
            .search-container {
                height: 48px !important;
                border-radius: 12px !important;
            }
            
            .search-button {
                padding: 0 20px !important;
                min-width: 100px !important;
                height: 48px !important;
                border-radius: 0 10px 10px 0 !important;
            }

            .search-input {
                font-size: 14px !important;
            }

            .input-container {
                padding-left: 16px !important;
            }
        }

        /* ⭐ FOCUS STYLES */
        .search-input:focus {
            color: #1a202c !important;
        }

        /* ⭐ ANIMATION FOR CONTAINER */
        @keyframes searchGlow {
            0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); }
            50% { box-shadow: 0 12px 40px rgba(255, 140, 66, 0.15); } /* ⭐ Orange */
        }
    `;

    return (
        <>
            <style>{enhancedStyles}</style>
            <div
                className="search-container"
                style={styles.container}
            >
                {/* ⭐ INPUT SECTION với icon */}
                <div className="input-container" style={styles.inputContainer}>
                    <SearchOutlined
                        className="search-icon"
                        style={styles.searchIcon}
                    />
                    <input
                        type="text"
                        className="search-input"
                        style={styles.input}
                        placeholder={placeholder}
                        value={searchText}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        autoComplete="off"
                        spellCheck="false"
                    />
                </div>

                {/* ⭐ CLEAR BUTTON với Ant Design icon */}
                {searchText && (
                    <button
                        className="clear-button"
                        style={styles.clearButton}
                        onClick={handleClear}
                        title="Xóa từ khóa tìm kiếm"
                        type="button"
                    >
                        <CloseOutlined style={{ fontSize: '12px' }} />
                    </button>
                )}

                {/* ⭐ SEARCH BUTTON với enhanced styling */}
                <button
                    className="search-button"
                    style={styles.searchButton}
                    onClick={handleSearch}
                    type="button"
                    title="Tìm kiếm phòng trọ"
                >
                    <SearchOutlined
                        className="search-button-icon"
                        style={{ fontSize: '18px' }}
                    />
                    <span className="search-button-text">Tìm kiếm</span>
                </button>
            </div>
        </>
    );
};

export default SearchBar;