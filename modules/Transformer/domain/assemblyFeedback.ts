export interface AssemblyFeedback {
    input: string;
    reason: string;
    actualAction: string;
    neededAction: string;
}
const actions: Record<string, string> = {
    mha: '但你放的自注意力用于在句内建立上下文',
    masked: '但你放的掩码自注意力只能读取译文前文和当前位置',
    cross: '但你放的交叉注意力用于读取原文，需要编码器的 K/V',
    ffn: '但你放的前馈网络用于逐词做非线性变换',
    norm: '但你放的模块用于残差相加和数值规范化',
};
function feedback(actual: string, neededAction: string, actualAction = actions[actual]): AssemblyFeedback {
    return { actualAction, neededAction, input: neededAction, reason: `此处需要${neededAction}。${actualAction}。` };
}
export function encoderAssemblyFeedback(expected: string, actual: string, slot: number): AssemblyFeedback {
    if (expected === 'mha')
        return feedback(actual, '先在原文内建立上下文');
    if (expected === 'ffn')
        return feedback(actual, '对上下文表示逐词做非线性变换');
    if (slot === 1)
        return feedback(actual, '将注意力输出与原输入相加，再调整数值尺度');
    return feedback(actual, '将逐词变换的结果与变换前的输入相加，再调整数值尺度');
}
export function decoderAssemblyFeedback(expected: string, actual: string, slot: number): AssemblyFeedback {
    if (expected === 'masked')
        return feedback(actual, '先在译文内建立上下文，不能读取后文', actual === 'mha' ? '但你放的自注意力会读取译文后文' : actions[actual]);
    if (expected === 'cross')
        return feedback(actual, '用译文的 Q 读取编码器提供的原文 K/V');
    if (expected === 'ffn')
        return feedback(actual, '对融合原文后的表示逐词做非线性变换');
    if (slot === 1)
        return feedback(actual, '将前文注意力的输出与译文输入相加，再调整数值尺度');
    if (slot === 3)
        return feedback(actual, '将原文读取结果与译文表示相加，再调整数值尺度');
    return feedback(actual, '将逐词变换的结果与变换前的输入相加，再调整数值尺度');
}
