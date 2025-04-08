#!/bin/bash

# 参数解析
usage() {
    echo "用法：$0 [-f 源字符串] [-t 目标字符串] [-d 目录]"
    echo "  -f 源字符串   需替换的原始字符串（默认：clash）"
    echo "  -t 目标字符串   替换后的新字符串（默认：classes）"
    echo "  -d 目录        操作的目标目录（默认：当前目录）"
    exit 1
}

FROM="clash"
TO="classes"
DIR="."

while getopts ":f:t:d:" opt; do
    case $opt in
        f) FROM="$OPTARG" ;;
        t) TO="$OPTARG" ;;
        d) DIR="$OPTARG" ;;
        \?) echo "无效选项 -$OPTARG" && usage ;;
    esac
done

# 核心处理函数
process_files() {
    local dir="$1"
    local from="$2"
    local to="$3"

    # 初始化计数器
    total=0
    success=0
    failed=0

    # 排除隐藏目录的find命令
    find "$dir" -depth \
        \( -name '.*' -prune \) -o \
        -type f -print0 | while IFS= read -r -d '' file; do

        ((total++))
        new_file=$(echo "$file" | sed -E "s/$from/$to/gI")

        # 实时目录切换提示
        current_dir="${file%/*}"
        if [ "$current_dir" != "$last_dir" ]; then
            echo -e "\n进入目录：$current_dir"
            last_dir="$current_dir"
        fi

        if [ "$file" != "$new_file" ]; then
            echo -e "\n正在处理：$file"
            echo "新名称：$new_file"

            # 尝试重命名
            mv -v -- "$file" "$new_file" 2>/dev/null
            if [ $? -eq 0 ]; then
                ((success++))
                echo "✅ 重命名成功"
            else
                ((failed++))
                echo "❌ 重命名失败（权限不足或其他错误）"
            fi
        fi
    done

    # 输出统计信息
    echo -e "\n--- 汇总 ---"
    echo "处理文件总数：$total"
    echo "成功重命名次数：$success"
    echo "失败重命名次数：$failed"
}

# 主程序入口
echo "开始批量重命名..."
echo "源字符串：'$FROM' → 目标字符串：'$TO'"
echo "目标目录：$DIR"

process_files "$DIR" "$FROM" "$TO"

echo "操作完成。"