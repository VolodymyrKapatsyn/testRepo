module.exports = (params)=>{
    const content = {};
    params.id !== undefined && (content.id = params.id.toString());
    params.context !== undefined && (content.context = params.context);
    return content;
};