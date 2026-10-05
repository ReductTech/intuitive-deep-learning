// 随机姓名池，仅包含用于标签展示的虚构姓名。
export const fictionalNames=['林','陈','许','苏','叶','江','沈','唐','宋','陶'].flatMap(
 surname=>['小禾','书宁','安晴','云舟','晨雨','星然','向阳','知夏','乐言','一诺'].map(given=>surname+given),
);
