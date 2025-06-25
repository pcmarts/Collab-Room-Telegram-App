import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogoAvatar } from '@/components/ui/logo-avatar';
import { Plus } from 'lucide-react';
import type { Company } from '@shared/schema';

export default function Companies() {
  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ['/api/companies']
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Companies</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies?.map(company => (
          <Card key={company.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <LogoAvatar 
                  name={company.name}
                  logoUrl={company.logo_url} 
                  className="w-8 h-8"
                  size="sm"
                />
                {company.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{company.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{company.industry}</span>
                <span>•</span>
                <a href={company.website} target="_blank" rel="noopener noreferrer" 
                   className="text-primary hover:underline">
                  Website
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
