import sqlite3
import json
import os

DB_NAME = "mock_roadmap.db"

def init_mock_db():
    print(f"Initializing local SQLite database: {DB_NAME}...")
    
    # If DB exists, remove it for a clean start
    if os.path.exists(DB_NAME):
        try:
            os.remove(DB_NAME)
            print(f"Removed existing {DB_NAME} for a clean reset.")
        except Exception as e:
            print(f"Warning: Could not remove {DB_NAME}: {e}")

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Create tables
    print("Creating tables...")
    cursor.execute("""
    CREATE TABLE career_tracks (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        career_track    TEXT NOT NULL,
        track_type      TEXT NOT NULL CHECK (track_type IN ('academic', 'vocational')),
        description     TEXT,
        avg_salary_min  INTEGER,
        avg_salary_max  INTEGER,
        education_route TEXT,
        typical_employers TEXT, -- JSON array of strings
        region_demand   TEXT,   -- JSON object
        vector_id       TEXT,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        local_demand_signals TEXT, -- JSON object
        timeline_trends TEXT      -- JSON object
    );
    """)

    cursor.execute("""
    CREATE TABLE role_progressions (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        career_track_id INTEGER NOT NULL,
        level           TEXT NOT NULL CHECK (level IN ('Entry', 'Mid', 'Advanced')),
        title           TEXT NOT NULL,
        description     TEXT,
        sort_order      INTEGER DEFAULT 0,
        FOREIGN KEY (career_track_id) REFERENCES career_tracks(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE skill_trees (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        career_track_id INTEGER NOT NULL,
        category        TEXT NOT NULL CHECK (category IN ('fundamentals', 'core_technologies', 'advanced_skills')),
        skill_name      TEXT NOT NULL,
        FOREIGN KEY (career_track_id) REFERENCES career_tracks(id) ON DELETE CASCADE
    );
    """)

    # 2. Mock data arrays
    career_tracks_data = [
        {
            "id": 1,
            "career_track": "Data Science / Analytics",
            "track_type": "academic",
            "description": "Phân tích dữ liệu, khai phá thông tin và xây dựng các mô hình học máy để dự báo xu hướng hoặc tối ưu hóa quy trình doanh nghiệp.",
            "avg_salary_min": 12000000,
            "avg_salary_max": 35000000,
            "education_route": "Đại học Công nghệ thông tin, Toán tin ứng dụng hoặc Khoa học dữ liệu",
            "typical_employers": ["FPT Software", "VNG Corporation", "Momo", "Techcombank", "Viettel Group"],
            "region_demand": {"HCM": "high", "HN": "high", "Binh_Duong": "medium"},
            "vector_id": "ct_ds_001",
            "local_demand_signals": {
                "HCM": {
                    "demand_level": "rising",
                    "average_salary": "15,000,000 - 30,000,000 VND",
                    "critical_shortage_skills": ["SQL nâng cao", "Machine Learning", "Python Data Stack"]
                },
                "Ha_Noi": {
                    "demand_level": "rising",
                    "average_salary": "14,000,000 - 28,000,000 VND",
                    "critical_shortage_skills": ["Data Modeling", "Business Intelligence", "PowerBI"]
                },
                "Binh_Duong": {
                    "demand_level": "stable",
                    "average_salary": "10,000,000 - 20,000,000 VND",
                    "critical_shortage_skills": ["Data Warehouse", "SQL"]
                }
            },
            "timeline_trends": {
                "monthly_demand_index": {
                    "2026-01": 100,
                    "2026-02": 110,
                    "2026-03": 125
                }
            }
        },
        {
            "id": 2,
            "career_track": "Software Engineering",
            "track_type": "academic",
            "description": "Thiết kế, xây dựng, tối ưu hóa và bảo trì các hệ thống phần mềm, ứng dụng di động và nền tảng web.",
            "avg_salary_min": 10000000,
            "avg_salary_max": 40000000,
            "education_route": "Đại học Công nghệ Thông tin, Khoa học Máy tính hoặc Kỹ thuật Phần mềm",
            "typical_employers": ["FPT Software", "KMS Technology", "NashTech", "Tiki", "VNG"],
            "region_demand": {"HCM": "high", "HN": "high", "Binh_Duong": "medium"},
            "vector_id": "ct_se_002",
            "local_demand_signals": {
                "HCM": {
                    "demand_level": "rising",
                    "average_salary": "16,000,000 - 35,000,000 VND",
                    "critical_shortage_skills": ["React/Next.js", "System Design", "Node.js/NestJS"]
                },
                "Ha_Noi": {
                    "demand_level": "rising",
                    "average_salary": "15,000,000 - 32,000,000 VND",
                    "critical_shortage_skills": ["Java Spring Boot", "DevOps", "Microservices"]
                },
                "Binh_Duong": {
                    "demand_level": "rising",
                    "average_salary": "12,000,000 - 22,000,000 VND",
                    "critical_shortage_skills": ["C# .NET", "ERP Customization"]
                }
            },
            "timeline_trends": {
                "monthly_demand_index": {
                    "2026-01": 105,
                    "2026-02": 112,
                    "2026-03": 118
                }
            }
        },
        {
            "id": 3,
            "career_track": "UI/UX Design",
            "track_type": "academic",
            "description": "Nghiên cứu hành vi người dùng và thiết kế giao diện, trải nghiệm trực quan cho các ứng dụng web và di động.",
            "avg_salary_min": 8000000,
            "avg_salary_max": 25000000,
            "education_route": "Đại học Thiết kế Đồ họa, Mỹ thuật Công nghiệp hoặc CNTT",
            "typical_employers": ["Be Group", "Momo", "Shopee", "FPT Software", "Zalo"],
            "region_demand": {"HCM": "high", "HN": "high", "Binh_Duong": "low"},
            "vector_id": "ct_uiux_003",
            "local_demand_signals": {
                "HCM": {
                    "demand_level": "rising",
                    "average_salary": "12,000,000 - 22,000,000 VND",
                    "critical_shortage_skills": ["Figma Prototyping", "User Research", "Design Systems"]
                },
                "Ha_Noi": {
                    "demand_level": "stable",
                    "average_salary": "10,000,000 - 20,000,000 VND",
                    "critical_shortage_skills": ["Wireframing", "Interaction Design"]
                },
                "Binh_Duong": {
                    "demand_level": "stable",
                    "average_salary": "8,000,000 - 14,000,000 VND",
                    "critical_shortage_skills": ["Graphic Design", "Web Layouts"]
                }
            },
            "timeline_trends": {
                "monthly_demand_index": {
                    "2026-01": 100,
                    "2026-02": 102,
                    "2026-03": 108
                }
            }
        },
        {
            "id": 4,
            "career_track": "Marketing Digital",
            "track_type": "academic",
            "description": "Tiếp thị kỹ thuật số, lập kế hoạch và tối ưu hóa các chiến dịch quảng cáo trực tuyến trên Google, Facebook, TikTok và tối ưu SEO.",
            "avg_salary_min": 7000000,
            "avg_salary_max": 20000000,
            "education_route": "Đại học Marketing, Quản trị Kinh doanh hoặc Thương mại điện tử",
            "typical_employers": ["Dentsu", "VCCorp", "Tiki", "Grab", "Các agency quảng cáo"],
            "region_demand": {"HCM": "high", "HN": "high", "Binh_Duong": "medium"},
            "vector_id": "ct_mkt_004",
            "local_demand_signals": {
                "HCM": {
                    "demand_level": "rising",
                    "average_salary": "10,000,000 - 18,000,000 VND",
                    "critical_shortage_skills": ["Performance Marketing", "TikTok Ads", "Content Strategy"]
                },
                "Ha_Noi": {
                    "demand_level": "stable",
                    "average_salary": "9,000,000 - 16,000,000 VND",
                    "critical_shortage_skills": ["SEO/SEM", "Google Analytics 4"]
                },
                "Binh_Duong": {
                    "demand_level": "stable",
                    "average_salary": "7,000,000 - 13,000,000 VND",
                    "critical_shortage_skills": ["Social Media Management", "Quảng cáo Facebook cơ bản"]
                }
            },
            "timeline_trends": {
                "monthly_demand_index": {
                    "2026-01": 95,
                    "2026-02": 105,
                    "2026-03": 115
                }
            }
        },
        {
            "id": 5,
            "career_track": "Kỹ thuật Tự động hóa / PLC",
            "track_type": "vocational",
            "description": "Vận hành, lập trình, lắp đặt và bảo trì hệ thống điều khiển tự động hóa bằng PLC, SCADA trong các nhà máy và dây chuyền sản xuất công nghiệp.",
            "avg_salary_min": 8000000,
            "avg_salary_max": 22000000,
            "education_route": "Cao đẳng nghề Điện - Tự động hóa hoặc Cơ điện tử (1.5 - 2 năm)",
            "typical_employers": ["Nhà máy Lego Bình Dương", "VinFast", "Schneider Electric", "Nhà máy bia Heineken", "Các xí nghiệp KCN VSIP/Sóng Thần"],
            "region_demand": {"Binh_Duong": "high", "HCM": "high", "HN": "medium"},
            "vector_id": "ct_auto_005",
            "local_demand_signals": {
                "Binh_Duong": {
                    "demand_level": "rising",
                    "average_salary": "9,000,000 - 16,000,000 VND",
                    "critical_shortage_skills": ["Lập trình PLC Siemens S7-1200", "Đọc bản vẽ tủ điện công nghiệp", "Bảo trì biến tần"]
                },
                "HCM": {
                    "demand_level": "stable",
                    "average_salary": "10,000,000 - 17,000,000 VND",
                    "critical_shortage_skills": ["Thiết kế hệ thống SCADA", "Đo lường điều khiển"]
                },
                "Ha_Noi": {
                    "demand_level": "stable",
                    "average_salary": "8,500,000 - 15,000,000 VND",
                    "critical_shortage_skills": ["Lập trình PLC Mitsubishi", "Vận hành cánh tay robot"]
                }
            },
            "timeline_trends": {
                "monthly_demand_index": {
                    "2026-01": 110,
                    "2026-02": 120,
                    "2026-03": 135
                }
            }
        },
        {
            "id": 6,
            "career_track": "Kỹ thuật Ô tô",
            "track_type": "vocational",
            "description": "Bảo dưỡng, chẩn đoán lỗi cơ điện và sửa chữa các hệ thống động cơ, khung gầm, điện lạnh trên các dòng xe ô tô hiện đại.",
            "avg_salary_min": 7000000,
            "avg_salary_max": 18000000,
            "education_route": "Cao đẳng nghề Công nghệ Kỹ thuật Ô tô (2 năm)",
            "typical_employers": ["Toyota Bình Dương", "Thaco Trường Hải", "VinFast Chevrolet", "Các garage ô tô tư nhân lớn"],
            "region_demand": {"Binh_Duong": "high", "HCM": "high", "HN": "high"},
            "vector_id": "ct_auto_moto_006",
            "local_demand_signals": {
                "Binh_Duong": {
                    "demand_level": "rising",
                    "average_salary": "8,000,000 - 14,000,000 VND",
                    "critical_shortage_skills": ["Đọc máy chẩn đoán lỗi OBD", "Sửa chữa hệ thống điện ô tô"]
                },
                "HCM": {
                    "demand_level": "rising",
                    "average_salary": "9,000,000 - 16,000,000 VND",
                    "critical_shortage_skills": ["Bảo dưỡng động cơ hybrid", "Đọc sơ đồ mạch điện xe đời mới"]
                },
                "Ha_Noi": {
                    "demand_level": "stable",
                    "average_salary": "8,500,000 - 15,000,000 VND",
                    "critical_shortage_skills": ["Đồng sơn ô tô", "Chẩn đoán hộp đen ECU"]
                }
            },
            "timeline_trends": {
                "monthly_demand_index": {
                    "2026-01": 100,
                    "2026-02": 105,
                    "2026-03": 110
                }
            }
        },
        {
            "id": 7,
            "career_track": "Đầu bếp / Quản lý F&B",
            "track_type": "vocational",
            "description": "Chuẩn bị nguyên liệu, chế biến các món ăn Á/Âu chuyên nghiệp và quản lý vận hành hoạt động bếp nhà hàng, khách sạn.",
            "avg_salary_min": 6000000,
            "avg_salary_max": 20000000,
            "education_route": "Trung cấp nghề Kỹ thuật Chế biến Món ăn hoặc Du lịch - Nhà hàng (1 - 2 năm)",
            "typical_employers": ["Khách sạn Becamex Bình Dương", "Khách sạn Sheraton Sài Gòn", "Golden Gate Group", "RedSun ITI", "Các nhà hàng tiệc cưới lớn"],
            "region_demand": {"HCM": "high", "Binh_Duong": "medium", "HN": "high"},
            "vector_id": "ct_chef_007",
            "local_demand_signals": {
                "HCM": {
                    "demand_level": "rising",
                    "average_salary": "8,000,000 - 18,000,000 VND",
                    "critical_shortage_skills": ["Chế biến món Âu cao cấp", "Quản lý chi phí nguyên liệu (Food Cost)"]
                },
                "Binh_Duong": {
                    "demand_level": "stable",
                    "average_salary": "7,000,000 - 13,000,000 VND",
                    "critical_shortage_skills": ["Kỹ năng đứng chảo chính bếp Hoa/Á", "Vệ sinh an toàn thực phẩm (HACCP)"]
                },
                "Ha_Noi": {
                    "demand_level": "stable",
                    "average_salary": "7,500,000 - 15,000,000 VND",
                    "critical_shortage_skills": ["Nấu món Việt truyền thống nâng cao", "Trang trí món ăn (Plating)"]
                }
            },
            "timeline_trends": {
                "monthly_demand_index": {
                    "2026-01": 90,
                    "2026-02": 110,
                    "2026-03": 105
                }
            }
        },
        {
            "id": 8,
            "career_track": "Điều dưỡng Trung cấp",
            "track_type": "vocational",
            "description": "Hỗ trợ bác sĩ thăm khám, chăm sóc sức khỏe, cấp thuốc và theo dõi tình trạng hồi phục của bệnh nhân tại bệnh viện hoặc trung tâm y tế.",
            "avg_salary_min": 7000000,
            "avg_salary_max": 15000000,
            "education_route": "Trung cấp hoặc Cao đẳng Điều dưỡng (2 - 3 năm)",
            "typical_employers": ["Bệnh viện Đa khoa tỉnh Bình Dương", "Bệnh viện Quốc tế Hạnh Phúc", "Bệnh viện Columbia Asia", "Các phòng khám đa khoa tư nhân"],
            "region_demand": {"Binh_Duong": "high", "HCM": "high", "HN": "medium"},
            "vector_id": "ct_nursing_008",
            "local_demand_signals": {
                "Binh_Duong": {
                    "demand_level": "stable",
                    "average_salary": "7,000,000 - 12,000,000 VND",
                    "critical_shortage_skills": ["Sơ cấp cứu", "Chăm sóc bệnh nhân hậu phẫu", "Kỹ năng giao tiếp người bệnh"]
                },
                "HCM": {
                    "demand_level": "rising",
                    "average_salary": "8,000,000 - 14,000,000 VND",
                    "critical_shortage_skills": ["Sử dụng máy thở/máy điện tim", "Điều dưỡng phòng hồi sức tích cực"]
                },
                "Ha_Noi": {
                    "demand_level": "stable",
                    "average_salary": "7,500,000 - 13,000,000 VND",
                    "critical_shortage_skills": ["Chăm sóc người cao tuổi", "Hỗ trợ sản khoa"]
                }
            },
            "timeline_trends": {
                "monthly_demand_index": {
                    "2026-01": 100,
                    "2026-02": 102,
                    "2026-03": 105
                }
            }
        }
    ]

    role_progressions_data = [
        # 1. Data Science
        (1, "Entry", "Data Analyst Intern", "Học việc, hỗ trợ làm sạch dữ liệu và lập báo cáo cơ bản.", 1),
        (1, "Mid", "Data Scientist", "Xây dựng các mô hình dự đoán và phân tích sâu các xu hướng dữ liệu của doanh nghiệp.", 2),
        (1, "Advanced", "Lead Data Scientist", "Định hướng kiến trúc dữ liệu và dẫn dắt đội ngũ kỹ sư phân tích giải quyết các bài toán kinh doanh lớn.", 3),
        # 2. Software Engineering
        (2, "Entry", "Junior Software Engineer", "Viết mã nguồn cho các module nhỏ dưới sự hướng dẫn của Senior.", 1),
        (2, "Mid", "Senior Software Engineer", "Thiết kế và phát triển các tính năng phức tạp, tối ưu hóa code và review cho Junior.", 2),
        (2, "Advanced", "Software Architect", "Thiết kế kiến trúc hệ thống tổng thể, chọn công nghệ và định hướng kỹ thuật cho toàn bộ dự án.", 3),
        # 3. UI/UX Design
        (3, "Entry", "Junior UI/UX Designer", "Vẽ wireframe, thiết kế mockups giao diện dựa trên design guidelines có sẵn.", 1),
        (3, "Mid", "Product Designer", "Nghiên cứu hành vi người dùng, vẽ luồng trải nghiệm (user flow) và tối ưu hóa giao diện dựa trên dữ liệu phản hồi.", 2),
        (3, "Advanced", "Design Lead", "Quản lý hệ thống thiết kế (Design System) của sản phẩm và định hình phong cách trực quan cho toàn công ty.", 3),
        # 4. Digital Marketing
        (4, "Entry", "Marketing Executive", "Lên bài viết mạng xã hội, chạy quảng cáo cơ bản và theo dõi số liệu báo cáo.", 1),
        (4, "Mid", "Digital Marketing Specialist", "Lập kế hoạch chiến dịch, tối ưu chi phí quảng cáo (CPA, ROI) và quản lý ngân sách marketing.", 2),
        (4, "Advanced", "Marketing Manager", "Xây dựng chiến lược thương hiệu và tiếp thị tổng thể, quản lý đội ngũ nhân viên sáng tạo và kỹ thuật.", 3),
        # 5. Automation/PLC
        (5, "Entry", "Kỹ thuật viên vận hành máy", "Giám sát bảng điều khiển, xử lý sự cố cơ điện cơ bản và bảo dưỡng dây chuyền.", 1),
        (5, "Mid", "Kỹ thuật viên PLC Senior", "Lập trình PLC Siemens/Mitsubishi, kết nối hệ thống SCADA và cải tiến hệ thống điều khiển.", 2),
        (5, "Advanced", "Trưởng phòng Kỹ thuật dây chuyền", "Quản lý đội ngũ bảo trì, lập kế hoạch cải tiến nâng cấp hệ thống điều khiển và tự động hóa toàn nhà máy.", 3),
        # 6. Automotive Engineering
        (6, "Entry", "Kỹ thuật viên bảo dưỡng nhanh", "Thay dầu, kiểm tra hệ thống phanh, lốp và hỗ trợ thợ chính.", 1),
        (6, "Mid", "Kỹ thuật viên chẩn đoán điện - máy", "Dùng máy quét OBD xác định lỗi hệ thống điện tử, sửa chữa động cơ và hộp số.", 2),
        (6, "Advanced", "Quản đốc xưởng dịch vụ", "Quản lý hoạt động sửa chữa tại xưởng, tư vấn kỹ thuật cho khách hàng và phân công công việc.", 3),
        # 7. Chef/F&B
        (7, "Entry", "Phụ bếp (Commis Chef)", "Sơ chế nguyên liệu, giữ vệ sinh khu vực bếp và hỗ trợ đầu bếp chính.", 1),
        (7, "Mid", "Đầu bếp chính (Demi Chef)", "Chịu trách nhiệm nấu chính tại một khu vực (bếp nóng, bếp lạnh, lò nướng) của nhà hàng.", 2),
        (7, "Advanced", "Bếp trưởng điều hành (Executive Chef)", "Lên thực đơn, quản lý nhân sự bếp, đàm phán nhà cung cấp và kiểm soát chi phí thực phẩm.", 3),
        # 8. Nursing
        (8, "Entry", "Điều dưỡng viên tập sự", "Thực hiện các công việc chăm sóc vệ sinh cho bệnh nhân dưới sự giám sát.", 1),
        (8, "Mid", "Điều dưỡng viên chính", "Tiêm truyền thuốc, đo chỉ số sinh tồn, hỗ trợ bác sĩ làm thủ thuật và quản lý hồ sơ bệnh án phòng bệnh.", 2),
        (8, "Advanced", "Điều dưỡng trưởng khoa", "Quản lý đội ngũ điều dưỡng của khoa, phân ca trực, giám sát quy trình kiểm soát nhiễm khuẩn.", 3)
    ]

    skill_trees_data = [
        # 1. Data Science
        (1, 'fundamentals', 'Toán Thống kê'), (1, 'fundamentals', 'Cơ sở dữ liệu SQL'), (1, 'fundamentals', 'Tư duy Logic'),
        (1, 'core_technologies', 'Python (Pandas, Numpy)'), (1, 'core_technologies', 'PowerBI / Tableau'), (1, 'core_technologies', 'Machine Learning (Scikit-Learn)'),
        (1, 'advanced_skills', 'Deep Learning (TensorFlow/PyTorch)'), (1, 'advanced_skills', 'Big Data (Spark, Hadoop)'), (1, 'advanced_skills', 'Cloud Computing (AWS/GCP)'),
        # 2. Software Engineering
        (2, 'fundamentals', 'Cấu trúc dữ liệu và Thuật toán'), (2, 'fundamentals', 'Lập trình hướng đối tượng (OOP)'), (2, 'fundamentals', 'Mạng máy tính & Hệ điều hành'),
        (2, 'core_technologies', 'JavaScript/TypeScript'), (2, 'core_technologies', 'Git & GitHub'), (2, 'core_technologies', 'RESTful API & CSDL'),
        (2, 'advanced_skills', 'Microservices Architecture'), (2, 'advanced_skills', 'Docker & Kubernetes (DevOps)'), (2, 'advanced_skills', 'Cloud Architecture (AWS/Azure)'),
        # 3. UI/UX Design
        (3, 'fundamentals', 'Nguyên lý thiết kế trực quan'), (3, 'fundamentals', 'Tâm lý học hành vi người dùng'), (3, 'fundamentals', 'Bố cục & Màu sắc'),
        (3, 'core_technologies', 'Figma'), (3, 'core_technologies', 'Adobe XD / Photoshop'), (3, 'core_technologies', 'Wireframing & Prototyping'),
        (3, 'advanced_skills', 'User Testing & Phỏng vấn'), (3, 'advanced_skills', 'Design System Management'), (3, 'advanced_skills', 'HTML/CSS cơ bản'),
        # 4. Digital Marketing
        (4, 'fundamentals', 'Hành vi người tiêu dùng'), (4, 'fundamentals', 'Viết lách sáng tạo (Copywriting)'), (4, 'fundamentals', 'Phân tích số liệu cơ bản'),
        (4, 'core_technologies', 'Facebook Business Manager / TikTok Ads'), (4, 'core_technologies', 'Google Ads / SEO Tools'), (4, 'core_technologies', 'Google Analytics 4 (GA4)'),
        (4, 'advanced_skills', 'Marketing Automation'), (4, 'advanced_skills', 'Data-Driven Marketing Strategy'), (4, 'advanced_skills', 'Quản lý ngân sách lớn'),
        # 5. Automation/PLC
        (5, 'fundamentals', 'Điện công nghiệp & Đo lường'), (5, 'fundamentals', 'An toàn lao động (HSE)'), (5, 'fundamentals', 'Đọc bản vẽ mạch điện CAD'),
        (5, 'core_technologies', 'Lập trình PLC (Siemens / Mitsubishi)'), (5, 'core_technologies', 'Thiết kế giao diện HMI / SCADA'), (5, 'core_technologies', 'Động cơ & Biến tần'),
        (5, 'advanced_skills', 'Robot công nghiệp (ABB, Kuka)'), (5, 'advanced_skills', 'Mạng truyền thông công nghiệp (Modbus, Profibus)'), (5, 'advanced_skills', 'IoT trong công nghiệp (IIoT)'),
        # 6. Automotive Engineering
        (6, 'fundamentals', 'Nguyên lý động cơ đốt trong'), (6, 'fundamentals', 'Điện - Điện tử ô tô căn bản'), (6, 'fundamentals', 'An toàn phòng cháy chữa cháy'),
        (6, 'core_technologies', 'Sử dụng máy đọc lỗi chuyên dụng (OBD)'), (6, 'core_technologies', 'Sửa chữa hệ thống gầm máy ô tô'), (6, 'core_technologies', 'Điện lạnh ô tô'),
        (6, 'advanced_skills', 'Bảo dưỡng pin & động cơ điện (EV)'), (6, 'advanced_skills', 'Cân chỉnh thước lái điện tử'), (6, 'advanced_skills', 'Sửa chữa hộp số tự động phức tạp'),
        # 7. Chef/F&B
        (7, 'fundamentals', 'Kỹ năng sử dụng dao & an toàn bếp'), (7, 'fundamentals', 'Vệ sinh an toàn thực phẩm (HACCP)'), (7, 'fundamentals', 'Phương pháp sơ chế nguyên liệu'),
        (7, 'core_technologies', 'Kỹ thuật nấu nướng Á/Âu'), (7, 'core_technologies', 'Kỹ năng đứng chảo nóng'), (7, 'core_technologies', 'Trình bày và trang trí món ăn'),
        (7, 'advanced_skills', 'Quản lý nhân sự & Bảng phân ca'), (7, 'advanced_skills', 'Tính toán Food Cost'), (7, 'advanced_skills', 'Thiết kế menu & Phát triển món ăn mới'),
        # 8. Nursing
        (8, 'fundamentals', 'Sinh lý học & Giải phẫu cơ bản'), (8, 'fundamentals', 'Đạo đức ngành y'), (8, 'fundamentals', 'Quy trình kiểm soát nhiễm khuẩn'),
        (8, 'core_technologies', 'Kỹ thuật tiêm, truyền tĩnh mạch'), (8, 'core_technologies', 'Đo và theo dõi sinh hiệu'), (8, 'core_technologies', 'Sử dụng dụng cụ y tế cơ bản'),
        (8, 'advanced_skills', 'Chăm sóc tích cực (ICU)'), (8, 'advanced_skills', 'Sơ cứu & Hồi sức tim phổi nâng cao (ACLS)'), (8, 'advanced_skills', 'Tâm lý học tiếp xúc bệnh nhân')
    ]

    # 3. Insert into career_tracks
    print("Inserting data into career_tracks...")
    for row in career_tracks_data:
        cursor.execute("""
        INSERT INTO career_tracks (
            id, career_track, track_type, description, avg_salary_min, avg_salary_max,
            education_route, typical_employers, region_demand, vector_id, local_demand_signals, timeline_trends
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            row["id"],
            row["career_track"],
            row["track_type"],
            row["description"],
            row["avg_salary_min"],
            row["avg_salary_max"],
            row["education_route"],
            json.dumps(row["typical_employers"]),
            json.dumps(row["region_demand"]),
            row["vector_id"],
            json.dumps(row["local_demand_signals"]),
            json.dumps(row["timeline_trends"])
        ))

    # 4. Insert into role_progressions
    print("Inserting data into role_progressions...")
    cursor.executemany("""
    INSERT INTO role_progressions (career_track_id, level, title, description, sort_order)
    VALUES (?, ?, ?, ?, ?);
    """, role_progressions_data)

    # 5. Insert into skill_trees
    print("Inserting data into skill_trees...")
    cursor.executemany("""
    INSERT INTO skill_trees (career_track_id, category, skill_name)
    VALUES (?, ?, ?);
    """, skill_trees_data)

    conn.commit()
    print("Database seeding completed successfully.")

    # 6. Verification query
    print("\nVerifying database content:")
    cursor.execute("SELECT COUNT(*) FROM career_tracks;")
    print(f"Total career tracks: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM role_progressions;")
    print(f"Total role progressions: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM skill_trees;")
    print(f"Total skills in skill trees: {cursor.fetchone()[0]}")

    conn.close()
    print(f"\nCreated and seeded '{DB_NAME}' successfully! You can now use it for local development.")

if __name__ == "__main__":
    init_mock_db()
