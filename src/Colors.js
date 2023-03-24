import React, { Component } from "react";
import Swatch from "./Swatch";
import * as d3 from "d3";

class Colors extends Component {
  colors = d3.schemeCategory10;
  width = d3.scaleBand().domain(d3.range(20));

  componentWillMount() {
    this.updateD3(this.props);
  }

  componentWillUpdate(newProps) {
    this.updateD3(newProps);
  }

  updateD3(props) {
    this.width.range([0, props.width]);
  }

  render() {
    const { data } = this.props;
    return (
      <g>
        <Swatch color={d3.rgb(data.color)} width={20} x={this.width(1)} y="0" />
      </g>
    );
  }
}

export default Colors;
