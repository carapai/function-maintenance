import {Component, OnInit, Input, OnChanges} from '@angular/core';
import {Visualization} from '../../models/visualization';
import {PaginationInstance} from 'ngx-pagination';
import {ChartService} from '../../providers/chart.service';

export const CHART_TYPES = [
  {
    type: 'column',
    description: 'Column chart',
    icon: 'assets/img/bar.png'
  },
  {
    type: 'line',
    description: 'Line chart',
    icon: 'assets/img/line.png'
  },
  {
    type: 'combined',
    description: 'Combined chart',
    icon: 'assets/img/combined.png'
  },
  {
    type: 'bar',
    description: 'Bar chart',
    icon: 'assets/img/column.png'
  },
  {
    type: 'area',
    description: 'Area chart',
    icon: 'assets/img/area.png'
  },
  {
    type: 'pie',
    description: 'Pie chart',
    icon: 'assets/img/pie.png'
  },
  {
    type: 'stacked_column',
    description: 'stacked column chart',
    icon: 'assets/img/column-stacked.png'
  },
  // {
  //   type: 'gauge',
  //   description: 'Gauge chart',
  //   icon: 'assets/img/gauge.jpg'
  // },
  {
    type: 'radar',
    description: 'Radar chart',
    icon: 'assets/img/radar.png'
  },
];

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit, OnChanges {

  @Input() chartData: Visualization;
  @Input() customFilters: any;
  loading: boolean = true;
  hasError: boolean = false;
  erroMessage: string;
  chartConfiguration: any = {
    optionsVisibility: 'hidden',
    blockWidth: '100%'
  };
  chartTypes: any[] = CHART_TYPES;

  chartObjects: any;

  public config: PaginationInstance = {
    id: 'custom',
    itemsPerPage: 1,
    currentPage: 1
  };
  constructor(private chartService: ChartService) { }

  ngOnInit() {
    this.initializeChart();
  }

  ngOnChanges() {
    if(this.customFilters.length > 0) {
      this.initializeChart();
    }
  }

  initializeChart() {
    this.chartService.getSanitizedChartData(this.chartData, this.customFilters).subscribe(sanitizedData => {
      this.chartData = sanitizedData;
      console.log(sanitizedData)
      this.chartObjects = this.chartService.getChartObjects(this.chartData);
      this.loading = false;
    }, error => {
      this.loading = false;
      this.hasError = true;
      this.erroMessage = error.hasOwnProperty('message') ? error.message : 'Unknown error has occurred';
      console.log(error.message)
    });
  }

  showChartOptions() {
    this.chartConfiguration.optionsVisibility = 'visible';
    this.chartConfiguration.blockWidth = '100% - 40px';
  }

  hideChartOptions() {
    this.chartConfiguration.optionsVisibility = 'hidden';
    this.chartConfiguration.blockWidth = '100%';
  }

  updateChartType(type, chartObject){
    this.loading = true;
    /**
     * Update chart object
     * @type {any[]}
     */
    this.chartObjects = this.chartService.getChartObjects(this.chartData, type);
    this.loading = false;

  }

}
