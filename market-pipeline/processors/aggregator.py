"""
processors/aggregator.py - Tính Median (Trung vị) từ nhiều JD cùng career_track.

Khi crawler thu thập được N JD cho cùng 1 ngành nghề, LLM sẽ chấm điểm từng JD.
Bước này nhóm tất cả điểm lại và tính Median để có 1 bộ điểm đại diện.

TẠI SAO DÙNG MEDIAN thay vì AVERAGE (Trung bình)?
- Một JD viết "phổi bò" (câu sáo, điểm ảo) sẽ bị Median trung hòa
- Average sẽ bị kéo lệch bởi các JD ngoại lệ
- Median bền vững hơn với outlier

Ví dụ:
  Backend Engineer - analytical_thinking scores từ 10 JDs:
  [9, 8, 9, 7, 2, 9, 8, 8, 9, 7]  → Median = 8.5 (loại trừ JD viết sai chấm 2)
  Average = 7.6 (bị kéo xuống bởi outlier 2)
"""
import numpy as np
from collections import defaultdict
from config import CORE_COMPETENCY_KEYS


def aggregate_jd_scores(scored_jds: list[dict]) -> dict:
    """
    Tính Median của nhiều bộ điểm JD để ra 1 bộ điểm đại diện.

    Args:
        scored_jds: Danh sách output từ llm_extractor, mỗi item là:
                    {
                      "career_track": str,
                      "core_competencies": {skill: score, ...},
                      "domain_competencies": {skill: {"weight_omega": float, "required_level": int}, ...}
                    }

    Returns:
        Dict chứa:
        - "core_competencies": {skill: median_score}     ← 1 bộ điểm đại diện
        - "domain_competencies": {skill: {...}}           ← Top skills theo median weight
        - "jd_count": số lượng JD đã aggregate
        - "confidence": độ tin cậy (% JD không phải outlier)
    """
    if not scored_jds:
        raise ValueError("Danh sách scored_jds rỗng")

    if len(scored_jds) == 1:
        # Chỉ có 1 JD → trả thẳng, không cần aggregate
        single = scored_jds[0]
        return {
            "core_competencies": single["core_competencies"],
            "domain_competencies": single["domain_competencies"],
            "jd_count": 1,
            "confidence": 0.5,  # Độ tin cậy thấp vì chỉ có 1 mẫu
        }

    # ── Aggregate Core Competencies (Median) ───────────────────────────────────
    core_collector = defaultdict(list)
    for jd in scored_jds:
        for skill, score in jd.get("core_competencies", {}).items():
            core_collector[skill].append(float(score))

    aggregated_core = {}
    for skill in CORE_COMPETENCY_KEYS:
        scores = core_collector.get(skill, [])
        if scores:
            aggregated_core[skill] = round(float(np.median(scores)), 2)
        else:
            aggregated_core[skill] = 5.0  # Default nếu không có dữ liệu

    # ── Aggregate Domain Competencies ──────────────────────────────────────────
    # Tổng hợp: skill nào xuất hiện nhiều JD nhất → weight_omega cao nhất
    domain_collector = defaultdict(lambda: {"weight_list": [], "level_list": []})
    total_jds = len(scored_jds)

    for jd in scored_jds:
        for skill, data in jd.get("domain_competencies", {}).items():
            domain_collector[skill]["weight_list"].append(data.get("weight_omega", 0.5))
            domain_collector[skill]["level_list"].append(data.get("required_level", 5))

    aggregated_domain = {}
    for skill, data in domain_collector.items():
        appearance_ratio = len(data["weight_list"]) / total_jds
        aggregated_domain[skill] = {
            "weight_omega": round(float(np.median(data["weight_list"])), 2),
            "required_level": int(np.median(data["level_list"])),
            "appearance_ratio": round(appearance_ratio, 2),  # % JD đề cập kỹ năng này
        }

    # Chỉ giữ lại top 8 kỹ năng xuất hiện nhiều nhất
    top_domain = dict(
        sorted(
            aggregated_domain.items(),
            key=lambda x: x[1]["appearance_ratio"],
            reverse=True
        )[:8]
    )
    # Xóa field appearance_ratio khỏi output cuối (chỉ dùng để sort)
    for skill in top_domain:
        top_domain[skill].pop("appearance_ratio", None)

    # ── Tính Confidence ─────────────────────────────────────────────────────────
    # Confidence = tỷ lệ JD không phải outlier (nằm trong 1.5 IQR)
    confidence_scores = []
    for skill in CORE_COMPETENCY_KEYS:
        scores = core_collector.get(skill, [])
        if len(scores) >= 4:
            q1, q3 = np.percentile(scores, [25, 75])
            iqr = q3 - q1
            non_outlier = sum(1 for s in scores if (q1 - 1.5 * iqr) <= s <= (q3 + 1.5 * iqr))
            confidence_scores.append(non_outlier / len(scores))

    overall_confidence = round(float(np.mean(confidence_scores)) if confidence_scores else 0.7, 2)

    return {
        "core_competencies": aggregated_core,
        "domain_competencies": top_domain,
        "jd_count": total_jds,
        "confidence": overall_confidence,
    }


def group_jds_by_career(scored_jds: list[dict]) -> dict[str, list[dict]]:
    """
    Nhóm danh sách JD đã chấm điểm theo career_track.

    Args:
        scored_jds: List của {career_track, core_competencies, domain_competencies}

    Returns:
        Dict: {"Backend Engineer": [jd1, jd2, ...], "Sales": [jd3, ...]}
    """
    groups = defaultdict(list)
    for jd in scored_jds:
        career = jd.get("career_track", "Unknown")
        groups[career].append(jd)
    return dict(groups)
