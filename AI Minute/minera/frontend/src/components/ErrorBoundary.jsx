import { Component } from "react";
export default class ErrorBoundary extends Component {
  constructor(p){ super(p); this.state={ err:null }; }
  static getDerivedStateFromError(err){ return { err }; }
  componentDidCatch(err){ console.error("[ui]", err); }
  render(){
    if(this.state.err){
      return (
        <div style={{maxWidth:520,margin:"14vh auto",padding:"0 20px",textAlign:"center"}}>
          <div style={{fontFamily:"'Anton',sans-serif",fontSize:54,textTransform:"uppercase"}}>OOPS</div>
          <p style={{fontSize:16,margin:"10px 0 20px"}}>Something hiccuped on screen. Your data is safe.</p>
          <pre className="mono" style={{fontSize:11,textAlign:"left",border:"3px solid var(--ink)",padding:12,overflow:"auto",background:"var(--paper2)"}}>{String(this.state.err?.message||this.state.err)}</pre>
          <button className="btn" style={{marginTop:16}} onClick={()=>{ this.setState({err:null}); location.reload(); }}>► RELOAD APP</button>
        </div>
      );
    }
    return this.props.children;
  }
}
