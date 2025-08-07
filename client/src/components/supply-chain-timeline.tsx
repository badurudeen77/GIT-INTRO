import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockTimelineData = [
  {
    stage: "Manufacturing",
    status: "completed",
    icon: "fas fa-industry",
    color: "bg-green-500",
    description: "Completed",
  },
  {
    stage: "Production",
    status: "completed", 
    icon: "fas fa-cogs",
    color: "bg-green-500",
    description: "Completed",
  },
  {
    stage: "Distribution",
    status: "in_progress",
    icon: "fas fa-truck",
    color: "bg-amber-500",
    description: "In Progress",
  },
  {
    stage: "Pharmacy",
    status: "pending",
    icon: "fas fa-store",
    color: "bg-gray-300",
    description: "Pending",
  },
  {
    stage: "Customer",
    status: "pending",
    icon: "fas fa-user",
    color: "bg-gray-300",
    description: "Pending",
  },
];

export function SupplyChainTimeline() {
  const getTextColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-neutral";
      case "in_progress":
        return "text-amber-600";
      case "pending":
        return "text-gray-600";
      default:
        return "text-gray-500";
    }
  };

  const getDescriptionColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-gray-600";
      case "in_progress":
        return "text-amber-600";
      case "pending":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-route text-accent"></i>
          <span>Supply Chain Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {mockTimelineData.map((item, index) => (
              <div key={item.stage} className="relative flex items-center space-x-4 pb-4 last:pb-0">
                <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center relative z-10`}>
                  <i className={`${item.icon} text-white text-xs`}></i>
                </div>
                <div>
                  <p className={`font-medium ${getTextColor(item.status)}`}>
                    {item.stage}
                  </p>
                  <p className={`text-sm ${getDescriptionColor(item.status)}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <i className="fas fa-info-circle mr-2"></i>
            This shows a sample supply chain status. Track a specific drug batch to see real-time updates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
